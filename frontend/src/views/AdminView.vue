<script>
import { chiliApi } from "@/services/api";

export default {
  data() {
    return {
      // Authentication
      isAuthenticated: false,
      password: "",
      adminPassword: "yourNewPassword", // Change this to your desired password
      showPasswordDialog: true,
      passwordError: false,
      
      numberOfChilis: 0,
      chiliEntries: [],
      showResetDialog: false,
      nextChiliNumber: 1,
      // Live scores table
      scoresTable: [],
      scoreHeaders: [
        { title: "#", key: "number", align: "center", width: "80px" },
        { title: "Name", key: "name", align: "start" },
        { title: "Cook", key: "cook", align: "start" },
        {
          title: "Scores",
          key: "score_count",
          align: "center",
          width: "100px",
        },
        {
          title: "Avg Total",
          key: "avg_total_score",
          align: "center",
          width: "120px",
        },
        {
          title: "Bonus Pts",
          key: "total_bonus_points",
          align: "center",
          width: "100px",
        },
        {
          title: "Final Score",
          key: "final_score",
          align: "center",
          width: "120px",
        },
        {
          title: "Avg Aroma",
          key: "avg_aroma",
          align: "center",
          width: "120px",
        },
        {
          title: "Avg Taste",
          key: "avg_taste",
          align: "center",
          width: "120px",
        },
        {
          title: "Max",
          key: "max_total_score",
          align: "center",
          width: "100px",
        },
      ],
      pollingIntervalId: null,
      bonusRoundActive: false,
    };
  },

  watch: {
    numberOfChilis(newValue) {
      // Convert to number and ensure it's positive
      const num = Math.max(0, parseInt(newValue) || 0);

      if (num <= 0) {
        this.chiliEntries = [];
        return;
      }

      // Update nextChiliNumber if needed
      this.nextChiliNumber =
        Math.max(...this.chiliEntries.map((c) => c.number || 0), 0) + 1;

      // Adjust array size
      if (num > this.chiliEntries.length) {
        const newEntries = Array(num - this.chiliEntries.length)
          .fill(null)
          .map(() => ({
            number: this.nextChiliNumber++,
            name: "",
            cook: "",
          }));
        this.chiliEntries.push(...newEntries);
      } else if (num < this.chiliEntries.length) {
        this.chiliEntries.splice(num);
      }
    },
  },

  async created() {
    // Check if already authenticated in this session
    if (sessionStorage.getItem('adminAuthenticated') === 'true') {
      this.isAuthenticated = true;
      this.showPasswordDialog = false;
      await this.initializeAdmin();
    }
  },

  beforeUnmount() {
    if (this.pollingIntervalId) clearInterval(this.pollingIntervalId);
  },

  methods: {
    async initializeAdmin() {
      await this.loadSettings();
      await this.loadBonusRoundStatus();
      await this.loadScores();
      this.startScoresPolling();
    },

    async authenticateAdmin() {
      if (this.password === this.adminPassword) {
        this.isAuthenticated = true;
        this.showPasswordDialog = false;
        this.passwordError = false;
        
        // Remember authentication for this session
        sessionStorage.setItem('adminAuthenticated', 'true');
        
        // Initialize admin functionality
        await this.initializeAdmin();
      } else {
        this.passwordError = true;
        this.password = "";
      }
    },

    logout() {
      this.isAuthenticated = false;
      this.showPasswordDialog = true;
      this.password = "";
      this.passwordError = false;
      
      // Clear authentication
      sessionStorage.removeItem('adminAuthenticated');
      
      // Stop polling
      if (this.pollingIntervalId) {
        clearInterval(this.pollingIntervalId);
        this.pollingIntervalId = null;
      }
    },

    async loadScores() {
      try {
        // Always load final scores (they work even without bonus data)
        const { data } = await chiliApi.getFinalScores();

        console.log("Scores loaded:", data);
        this.scoresTable = Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error loading scores:", error);
        // Fallback to regular scores if final scores fail
        try {
          const { data } = await chiliApi.getAllScores();
          this.scoresTable = Array.isArray(data) ? data : [];
        } catch (fallbackError) {
          console.error("Both score endpoints failed:", fallbackError);
        }
      }
    },

    async loadBonusRoundStatus() {
      try {
        const { data } = await chiliApi.getBonusRoundStatus();
        this.bonusRoundActive = data.bonus_round_active;
      } catch (error) {
        console.error("Error loading bonus round status:", error);
      }
    },

    async startBonusRound() {
      try {
        await chiliApi.startBonusRound();
        this.bonusRoundActive = true;
        console.log("Bonus round started");
      } catch (error) {
        console.error("Error starting bonus round:", error);
      }
    },

    async endBonusRound() {
      try {
        await chiliApi.endBonusRound();
        this.bonusRoundActive = false;
        await this.loadScores(); // Refresh to show final results
        console.log("Bonus round ended");
      } catch (error) {
        console.error("Error ending bonus round:", error);
      }
    },

    startScoresPolling(interval = 5000) {
      if (this.pollingIntervalId) clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = setInterval(() => {
        this.loadBonusRoundStatus();
        this.loadScores();
      }, interval);
    },

    formatNumber(value) {
      if (value === null || value === undefined) return "0.00";
      const n = Number(value);
      return Number.isFinite(n) ? n.toFixed(2) : "0.00";
    },

    // Color code the average scores - higher is better
    getScoreColor(avgScore) {
      if (!avgScore || avgScore === 0) return "grey";
      if (avgScore >= 40) return "success"; // 40-50: Excellent
      if (avgScore >= 30) return "info"; // 30-39: Good
      if (avgScore >= 20) return "warning"; // 20-29: Fair
      return "error"; // 0-19: Poor
    },

    addChili() {
      this.chiliEntries.push({
        number: this.nextChiliNumber++,
        name: "",
        cook: "",
      });
      this.numberOfChilis = this.chiliEntries.length;
    },

    async removeChili(index) {
      const chili = this.chiliEntries[index];
      const number = parseInt(chili.number, 10);

      // Optimistic UI: remove locally first
      this.chiliEntries.splice(index, 1);
      this.numberOfChilis = this.chiliEntries.length;

      // Always try to delete from database - let the API handle if it doesn't exist
      try {
        await chiliApi.deleteByNumber(number);
        console.log("Deleted chili #" + number + " from database");
      } catch (error) {
        console.error("Error deleting chili:", error);
        if (error.response?.status === 404) {
          // Chili didn't exist in database, UI removal is sufficient
          console.log(
            "Chili #" + number + " was not in database, removed from UI only"
          );
        } else {
          // Revert UI change on real API error
          this.chiliEntries.splice(index, 0, chili);
          this.numberOfChilis = this.chiliEntries.length;
          alert("Failed to delete chili from database. Please try again.");
        }
      }
    },

    async loadSettings() {
      try {
        const { data } = await chiliApi.getAll();
        this.chiliEntries = Array.isArray(data) ? data : [];
        this.numberOfChilis = this.chiliEntries.length;
      } catch (error) {
        console.error("Error loading chilis:", error);
        this.chiliEntries = [];
        this.numberOfChilis = 0;
      }
    },

    async saveSettings() {
      try {
        for (const chili of this.chiliEntries) {
          const payload = {
            number: chili.number,
            name: chili.name || "",
            cook: chili.cook || "",
          };
          console.log("Saving chili:", payload);
          await chiliApi.create(payload);
        }
        console.log("All chilis saved successfully");
        // Reload scores after saving chilis
        await this.loadScores();
      } catch (error) {
        console.error("Error saving chilis:", error.response || error);
      }
    },

    resetCompetition() {
      this.showResetDialog = true;
    },

    async confirmReset() {
      try {
        await chiliApi.delete();
        this.chiliEntries = [];
        this.numberOfChilis = 0;
        this.bonusRoundActive = false; // Reset bonus round state
        this.showResetDialog = false;
        // Clear voting localStorage when competition is reset
        localStorage.removeItem("chiliScores");
        // Clear bonus round localStorage
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("bonus_submitted_")) {
            localStorage.removeItem(key);
          }
        });
        console.log("Competition reset and voting history cleared");
        await this.loadScores(); // Refresh scores table
      } catch (error) {
        console.error("Error resetting competition:", error);
      }
    },
  },
};
</script>

<style scoped>
.v-expansion-panels {
  margin-top: 20px;
}
</style>

<template>
  <!-- Password Authentication Dialog -->
  <v-dialog v-model="showPasswordDialog" persistent max-width="400">
    <v-card>
      <v-card-title class="text-h5 text-center">
        <v-icon icon="mdi-lock" class="mr-2"></v-icon>
        Admin Access Required
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="authenticateAdmin">
          <v-text-field
            v-model="password"
            label="Admin Password"
            type="password"
            :error="passwordError"
            :error-messages="passwordError ? 'Incorrect password' : ''"
            @keyup.enter="authenticateAdmin"
            autofocus
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          @click="authenticateAdmin"
          :disabled="!password"
        >
          Access Admin
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Admin Panel Content (only shown when authenticated) -->
  <div v-if="isAuthenticated">
    <v-card class="mb-4">
      <v-card-title class="text-h4 d-flex align-center">
        Admin Panel
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          variant="outlined"
          size="small"
          @click="logout"
          prepend-icon="mdi-logout"
        >
          Logout
        </v-btn>
      </v-card-title>

      <!-- Competition Setup -->
      <v-card-text>
        <v-form @submit.prevent="saveSettings" ref="form">
          <div class="d-flex align-center gap-2 mb-4">
            <v-text-field
              v-model="numberOfChilis"
              type="number"
              label="Number of Chilis in Competition"
              :rules="[
                (v) => !!v || 'Required',
                (v) => v > 0 || 'Must be greater than 0',
              ]"
              min="1"
              max="100"
            ></v-text-field>
            <v-btn
              color="success"
              @click="addChili"
              icon="mdi-plus"
              size="x-large"
            ></v-btn>
          </div>

          <!-- Chili Entry List -->
          <v-expansion-panels v-if="chiliEntries.length > 0">
            <v-expansion-panel
              v-for="(chili, index) in chiliEntries"
              :key="chili.number"
            >
              <v-expansion-panel-title>
                Chili #{{ chili.number }}
                <template v-slot:actions>
                  <v-chip
                    v-if="chili.name"
                    color="primary"
                    size="small"
                    class="mr-2"
                  >
                    Named
                  </v-chip>
                  <v-btn
                    color="error"
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    @click.stop="removeChili(index)"
                  ></v-btn>
                </template>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <v-text-field
                  v-model="chili.name"
                  label="Secret Chili Name/Description"
                  :placeholder="'Enter name for Chili #' + chili.number"
                  hide-details
                  class="mb-2"
                ></v-text-field>
                <v-text-field
                  v-model="chili.cook"
                  label="Cook's Name"
                  :placeholder="'Enter cook\'s name for Chili #' + chili.number"
                  hide-details
                ></v-text-field>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4 d-flex flex-wrap gap-2">
        <v-spacer class="d-none d-sm-block"></v-spacer>
        <v-btn
          color="error"
          variant="outlined"
          :block="$vuetify.display.xs"
          class="flex-grow-1 flex-sm-grow-0"
          @click="resetCompetition"
        >
          Reset Competition
        </v-btn>
        <v-btn
          v-if="!bonusRoundActive"
          color="warning"
          variant="outlined"
          :block="$vuetify.display.xs"
          class="flex-grow-1 flex-sm-grow-0"
          @click="startBonusRound"
        >
          Start Bonus Round
        </v-btn>
        <v-btn
          v-else
          color="success"
          variant="outlined"
          :block="$vuetify.display.xs"
          class="flex-grow-1 flex-sm-grow-0"
          @click="endBonusRound"
        >
          End Bonus Round
        </v-btn>
        <v-btn
          color="primary"
          :block="$vuetify.display.xs"
          class="flex-grow-1 flex-sm-grow-0"
          @click="saveSettings"
        >
          Save Settings
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Live Scores Table -->
    <v-card class="mt-6">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-chart-bar" class="mr-2"></v-icon>
        <span>{{
          bonusRoundActive ? "Final Scores (Bonus Round)" : "Live Scores"
        }}</span>
        <v-spacer></v-spacer>
        <v-chip
          v-if="bonusRoundActive"
          color="warning"
          size="small"
          class="mr-2"
        >
          Bonus Round Active
        </v-chip>
        <v-chip color="success" size="small"> Auto-refreshing every 5s </v-chip>
      </v-card-title>
      <v-card-text>
        <v-data-table
          :items="scoresTable"
          :headers="scoreHeaders"
          item-value="number"
          density="compact"
          :items-per-page="-1"
          class="elevation-1"
        >
          <!-- Format average total score to 2 decimals -->
          <template v-slot:item.avg_total_score="{ item }">
            <v-chip
              :color="getScoreColor(item.avg_total_score)"
              size="small"
              variant="flat"
            >
              {{ formatNumber(item.avg_total_score) }}
            </v-chip>
          </template>

          <!-- Format average aroma to 2 decimals -->
          <template v-slot:item.avg_aroma="{ item }">
            {{ formatNumber(item.avg_aroma) }}
          </template>

          <!-- Format average taste to 2 decimals -->
          <template v-slot:item.avg_taste="{ item }">
            {{ formatNumber(item.avg_taste) }}
          </template>

          <!-- Show max score or dash if no scores -->
          <template v-slot:item.max_total_score="{ item }">
            {{ item.max_total_score || "-" }}
          </template>

          <!-- Show score count with badge -->
          <template v-slot:item.score_count="{ item }">
            <v-chip
              :color="item.score_count > 0 ? 'primary' : 'grey'"
              size="small"
              variant="flat"
            >
              {{ item.score_count }}
            </v-chip>
          </template>

          <!-- Add bonus points column -->
          <template v-slot:item.total_bonus_points="{ item }">
            <v-chip
              :color="item.total_bonus_points > 0 ? 'warning' : 'grey'"
              size="small"
              variant="flat"
            >
              +{{ item.total_bonus_points || 0 }}
            </v-chip>
          </template>

          <!-- Add final score column -->
          <template v-slot:item.final_score="{ item }">
            <v-chip
              :color="getScoreColor(item.final_score || item.avg_total_score)"
              size="small"
              variant="flat"
            >
              {{ formatNumber(item.final_score || item.avg_total_score) }}
            </v-chip>
          </template>

          <!-- Empty state message -->
          <template v-slot:no-data>
            <div class="text-center pa-4">
              <v-icon size="64" color="grey">mdi-clipboard-outline</v-icon>
              <p class="text-h6 mt-2">No scores yet</p>
              <p class="text-body-2">
                Scores will appear here as judges submit them
              </p>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>

  <!-- Confirmation Dialog -->
  <v-dialog v-model="showResetDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h5">Reset Competition?</v-card-title>
      <v-card-text>
        This will clear all chili entries and scores. This action cannot be
        undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" @click="showResetDialog = false">Cancel</v-btn>
        <v-btn color="error" @click="confirmReset">Reset All</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
