<template>
  <v-container>
    <!-- Main Scoring Sheet Card - hide when bonus round is active -->
    <v-card v-if="!bonusRoundActive" class="mb-4">
      <v-card-title class="text-h4 text-sm-h3 text-break text-wrap pa-4">
        <div class="d-flex align-center">
          <v-icon icon="mdi-clipboard-text" color="primary" class="mr-2"></v-icon>
          <span class="text-h5 text-sm-h4">Scoring Sheet</span>
        </div>
      </v-card-title>
      <v-card-subtitle class="text-wrap">
        Score each category from 0-10 points
      </v-card-subtitle>
      
      <v-card-text>
        <!-- Show completion message when voted on all chilis -->
        <v-alert v-if="hasVotedOnAllChilis" type="success" class="mb-4">
          <strong>Thank you for voting!</strong> You have completed scoring all chilis.
        </v-alert>

        <!-- Show warning when current chili already scored -->
        <v-alert v-else-if="currentChiliAlreadyScored" type="info" class="mb-4">
          You have already submitted scores for this chili. Scores are readonly.
        </v-alert>

        <v-alert v-if="hasVoted" type="warning" class="mb-4">
          You have already submitted scores for this chili!
        </v-alert>
        
        <v-form v-else @submit.prevent="submitVote" ref="form">
          <v-select
            v-model="selectedChili"
            :items="availableChilis"
            :disabled="hasVotedOnAllChilis"
            label="Select Chili to Score"
            item-title="name"
            item-value="number"
            required
          >
            <!-- Add custom item template -->
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:append v-if="hasChiliBeenScored(item.raw.number)">
                  <v-chip
                    color="success"
                    size="small"
                    class="ml-2"
                  >
                    Scored
                  </v-chip>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <v-expansion-panels v-if="selectedChili" v-model="activePanel">
            <!-- Aroma Section -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                Aroma ({{ scores.aroma || 0 }}/10)
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-slider
                  v-model="scores.aroma"
                  :min="0"
                  :max="10"
                  :step="1"
                  :readonly="isFormReadonly"
                  :disabled="isFormReadonly"
                  :ticks="[0, 2, 4, 6, 8, 10]"
                  :tick-labels="['0', '2', '4', '6', '8', '10']"
                  label="Aroma Score"
                ></v-slider>
                <v-card flat class="mt-2">
                  <v-card-text>
                    <strong>Scoring Guide:</strong><br>
                    9-10: Incredible, complex, makes you immediately want to taste<br>
                    7-8: Very appealing, good complexity<br>
                    5-6: Pleasant but simple<br>
                    3-4: Weak or slightly off-putting<br>
                    1-2: Unpleasant or no aroma
                  </v-card-text>
                </v-card>

                <v-card-actions class="mt-4 d-flex justify-space-between">
                  <v-btn
                    v-if="showBackButton"
                    color="secondary"
                    variant="outlined"
                    class="flex-grow-0"
                    @click="activePanel = currentIndex - 1"
                  >
                    <v-icon start>mdi-chevron-left</v-icon>
                    <span class="d-none d-sm-inline">Back: {{ getPreviousSection() }}</span>
                    <span class="d-sm-none">Back</span>
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-btn
                    v-if="showNextButton"
                    color="primary"
                    variant="outlined"
                    class="flex-grow-0"
                    @click="activePanel = currentIndex + 1"
                  >
                    <span class="d-none d-sm-inline">Next: {{ getNextSection() }}</span>
                    <span class="d-sm-none">Next</span>
                    <v-icon end>mdi-chevron-right</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Appearance Section -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                Appearance ({{ scores.appearance || 0 }}/10)
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-slider
                  v-model="scores.appearance"
                  :min="0"
                  :max="10"
                  :step="1"
                  :readonly="isFormReadonly"
                  :disabled="isFormReadonly"
                  :ticks="[0, 2, 4, 6, 8, 10]"
                  :tick-labels="['0', '2', '4', '6', '8', '10']"
                  label="Appearance Score"
                ></v-slider>
                <v-card flat class="mt-2">
                  <v-card-text>
                    <strong>Scoring Guide:</strong><br>
                    9-10: Perfect consistency, vibrant color, visible quality ingredients<br>
                    7-8: Good texture and color, appealing<br>
                    5-6: Average appearance, acceptable<br>
                    3-4: Too thick/thin, dull color<br>
                    1-2: Unappealing, poor consistency
                  </v-card-text>
                </v-card>

                <v-card-actions class="mt-4 d-flex justify-space-between">
                  <v-btn
                    v-if="showBackButton"
                    color="secondary"
                    variant="outlined"
                    class="flex-grow-0"
                    @click="activePanel = currentIndex - 1"
                  >
                    <v-icon start>mdi-chevron-left</v-icon>
                    <span class="d-none d-sm-inline">Back: {{ getPreviousSection() }}</span>
                    <span class="d-sm-none">Back</span>
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-btn
                    v-if="showNextButton"
                    color="primary"
                    variant="outlined"
                    class="flex-grow-0"
                    @click="activePanel = currentIndex + 1"
                  >
                    <span class="d-none d-sm-inline">Next: {{ getNextSection() }}</span>
                    <span class="d-sm-none">Next</span>
                    <v-icon end>mdi-chevron-right</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Taste Section -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                Taste ({{ scores.taste || 0 }}/10)
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-slider
                  v-model="scores.taste"
                  :min="0"
                  :max="10"
                  :step="1"
                  :readonly="isFormReadonly"
                  :disabled="isFormReadonly"
                  :ticks="[0, 2, 4, 6, 8, 10]"
                  :tick-labels="['0', '2', '4', '6', '8', '10']"
                  label="Taste Score"
                ></v-slider>
                <v-card flat class="mt-2">
                  <v-card-text>
                    <strong>Scoring Guide:</strong><br>
                    9-10: Outstanding flavor, perfectly balanced, memorable<br>
                    7-8: Very good, well-balanced, satisfying<br>
                    5-6: Good but missing something, decent balance<br>
                    3-4: Unbalanced, bland, or one note<br>
                    1-2: Poor flavor, unpleasant
                  </v-card-text>
                </v-card>

                <v-card-actions class="mt-4 d-flex justify-space-between">
                  <v-btn
                    v-if="showBackButton"
                    color="secondary"
                    variant="outlined"
                    class="flex-grow-0"
                    @click="activePanel = currentIndex - 1"
                  >
                    <v-icon start>mdi-chevron-left</v-icon>
                    <span class="d-none d-sm-inline">Back: {{ getPreviousSection() }}</span>
                    <span class="d-sm-none">Back</span>
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-btn
                    v-if="showNextButton"
                    color="primary"
                    variant="outlined"
                    class="flex-grow-0"
                    @click="activePanel = currentIndex + 1"
                  >
                    <span class="d-none d-sm-inline">Next: {{ getNextSection() }}</span>
                    <span class="d-sm-none">Next</span>
                    <v-icon end>mdi-chevron-right</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Heat Level Section -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                Heat Level ({{ scores.heatLevel || 0 }}/10)
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-slider
                  v-model="scores.heatLevel"
                  :min="0"
                  :max="10"
                  :step="1"
                  :readonly="isFormReadonly"
                  :disabled="isFormReadonly"
                  :ticks="[0, 2, 4, 6, 8, 10]"
                  :tick-labels="['0', '2', '4', '6', '8', '10']"
                  label="Heat Level Score"
                ></v-slider>
                <v-card flat class="mt-2">
                  <v-card-text>
                    <strong>Scoring Guide:</strong><br>
                    9-10: Perfect heat that enhances flavor without overwhelming<br>
                    7-8: Good heat balance, complements well<br>
                    5-6: Acceptable heat, could be better integrated<br>
                    3-4: Too hot or too mild, poorly balanced<br>
                    1-2: Painfully hot or no heat at all when needed
                  </v-card-text>
                </v-card>

                <v-card-actions class="mt-4 d-flex justify-space-between">
                  <v-btn
                    v-if="showBackButton"
                    color="secondary"
                    variant="outlined"
                    class="flex-grow-0"
                    @click="activePanel = currentIndex - 1"
                  >
                    <v-icon start>mdi-chevron-left</v-icon>
                    <span class="d-none d-sm-inline">Back: {{ getPreviousSection() }}</span>
                    <span class="d-sm-none">Back</span>
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-btn
                    v-if="showNextButton"
                    color="primary"
                    variant="outlined"
                    class="flex-grow-0"
                    @click="activePanel = currentIndex + 1"
                  >
                    <span class="d-none d-sm-inline">Next: {{ getNextSection() }}</span>
                    <span class="d-sm-none">Next</span>
                    <v-icon end>mdi-chevron-right</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Creativity Section -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                Creativity ({{ scores.creativity || 0 }}/10)
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-slider
                  v-model="scores.creativity"
                  :min="0"
                  :max="10"
                  :step="1"
                  :readonly="isFormReadonly"
                  :disabled="isFormReadonly"
                  :ticks="[0, 2, 4, 6, 8, 10]"
                  :tick-labels="['0', '2', '4', '6', '8', '10']"
                  label="Creativity Score"
                ></v-slider>
                <v-card flat class="mt-2">
                  <v-card-text>
                    <strong>Scoring Guide:</strong><br>
                    9-10: Unique ingredients, innovative technique, truly original<br>
                    7-8: Creative twist on traditional, interesting combination<br>
                    5-6: Some creative elements, decent originality<br>
                    3-4: Standard recipe with minor variations<br>
                    1-2: Very basic, no creativity or originality
                  </v-card-text>
                </v-card>

                <v-card-actions class="mt-4 d-flex justify-space-between">
                  <v-btn
                    v-if="showBackButton"
                    color="secondary"
                    variant="outlined"
                    class="flex-grow-0"
                    @click="activePanel = currentIndex - 1"
                  >
                    <v-icon start>mdi-chevron-left</v-icon>
                    <span class="d-none d-sm-inline">Back: {{ getPreviousSection() }}</span>
                    <span class="d-sm-none">Back</span>
                  </v-btn>
                </v-card-actions>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-card v-if="selectedChili" flat class="mt-4 pa-2">
            <v-card-title>Total Score: {{ totalScore }}/50</v-card-title>
          </v-card>

          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn
              v-if="!hasVotedOnAllChilis && !currentChiliAlreadyScored"
              color="primary"
              size="large"
              type="submit"
              :disabled="!isFormValid"
              prepend-icon="mdi-send"
            >
              Submit my Chili Scores
            </v-btn>
            <v-btn
              v-else-if="hasVotedOnAllChilis"
              color="success"
              size="large"
              disabled
            >
              <v-icon start>mdi-check</v-icon>
              All Chilis Scored
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Success/Error Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="top"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Zero Score Warning Dialog -->
    <v-dialog v-model="showZeroScoreWarning" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Warning: Zero Scores Detected</v-card-title>
        <v-card-text>
          The following categories have zero points: <strong>{{ zeroScoreCategories }}</strong>
          <br><br>
          Are you sure you want to submit these scores?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="showZeroScoreWarning = false">Review Scores</v-btn>
          <v-btn color="primary" @click="confirmSubmitWithZeros">Submit Anyway</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bonus Round Card - only show when active -->
    <v-card v-if="bonusRoundActive" class="mb-4">
      <v-card-title class="text-h4 text-sm-h3 text-break text-wrap pa-4">
        <div class="d-flex align-center">
          <v-icon icon="mdi-star" color="warning" class="mr-2"></v-icon>
          <span class="text-h5 text-sm-h4">Bonus Round - Tie Breaker</span>
        </div>
      </v-card-title>
      <v-card-subtitle class="text-wrap">
        Distribute up to {{ maxBonusPoints }} bonus points among chilis to break ties
      </v-card-subtitle>
      
      <v-card-text>
        <v-alert v-if="bonusRoundActive && hasSubmittedBonus" type="success" class="mb-4">
          <strong>Bonus scores submitted!</strong> You distributed {{ totalBonusPoints }} points.
        </v-alert>
        
        <v-alert v-else-if="bonusRoundActive && !hasSubmittedBonus" type="info" class="mb-4">
          You have {{ remainingBonusPoints }} bonus points remaining to distribute.
        </v-alert>

        <!-- No tied chilis message -->
        <v-alert v-if="bonusChilis.length === 0 && bonusRoundActive" type="info" class="mb-4">
          <strong>No tied chilis found.</strong>
          <br>Bonus points are only available for chilis with identical scores to break ties.
        </v-alert>

        <!-- Bonus Points Grid -->
        <v-row v-if="bonusChilis.length > 0">
          <v-col 
            v-for="chili in bonusChilis" 
            :key="chili.number" 
            cols="12" 
            sm="6" 
            md="4"
          >
            <v-card 
              variant="outlined" 
              class="pa-3"
              :class="{ 'border-warning': chili.isWinner }"
            >
              <v-card-title class="text-h6 d-flex align-center">
                Chili #{{ chili.number }}
                <v-chip 
                  v-if="chili.isWinner"
                  color="warning" 
                  size="small" 
                  class="ml-2"
                >
                  Tied
                </v-chip>
              </v-card-title>
              <v-card-subtitle v-if="chili.name">
                {{ chili.name }}
              </v-card-subtitle>
              <v-card-subtitle v-if="chili.currentScore > 0" class="text-caption">
                Current Score: {{ chili.currentScore.toFixed(2) }}
              </v-card-subtitle>
              
              <v-slider
                :model-value="bonusScores[chili.number] || 0"
                @update:model-value="updateBonusPoints(chili.number, $event)"
                :min="0"
                :max="Math.min(10, remainingBonusPoints + (bonusScores[chili.number] || 0))"
                :step="1"
                :disabled="!bonusRoundActive || hasSubmittedBonus"
                show-ticks
              >
                <template v-slot:append>
                  <v-chip 
                    :color="bonusScores[chili.number] > 0 ? 'warning' : 'grey'"
                    size="small"
                  >
                    {{ bonusScores[chili.number] || 0 }}
                  </v-chip>
                </template>
              </v-slider>
            </v-card>
          </v-col>
        </v-row>

        <!-- Bonus Summary -->
        <v-card v-if="!hasSubmittedBonus" flat class="mt-4 pa-2">
          <v-card-title class="d-flex justify-space-between">
            <span>Points Used: {{ totalBonusPoints }}/{{ maxBonusPoints }}</span>
            <v-progress-linear
              :model-value="(totalBonusPoints / maxBonusPoints) * 100"
              :color="totalBonusPoints > maxBonusPoints ? 'error' : 'warning'"
              height="8"
              class="flex-grow-1 mx-4"
            ></v-progress-linear>
          </v-card-title>
        </v-card>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            v-if="!hasSubmittedBonus"
            color="warning"
            size="large"
            :disabled="!canSubmitBonus || totalBonusPoints === 0 || bonusChilis.length === 0"
            @click="submitBonusScores"
          >
            <v-icon start>mdi-star</v-icon>
            Submit Bonus Points ({{ totalBonusPoints }})
          </v-btn>
          <v-btn
            v-else
            color="success"
            size="large"
            disabled
          >
            <v-icon start>mdi-check</v-icon>
            Bonus Points Submitted
          </v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>

    <!-- Add Chili Modal -->
    <v-dialog v-model="showAddChiliModal" persistent max-width="500px">
      <v-card>
        <v-card-title class="text-h5 d-flex align-center">
          <v-icon icon="mdi-chili-hot" color="primary" class="mr-2"></v-icon>
          Submit Your Chili
        </v-card-title>
        <v-card-subtitle>
          Enter your chili into the competition
        </v-card-subtitle>
        
        <v-card-text>
          <v-alert type="info" variant="outlined" class="mb-4">
            <div class="text-body-2">
              <strong>Tips for your chili name:</strong>
              <ul class="mt-2 ml-4">
                <li>Don't include your name in the chili name</li>
                <li>Be creative and unique!</li>
                <li>Keep it family-friendly</li>
              </ul>
            </div>
          </v-alert>
          
          <v-form @submit.prevent="submitChili" ref="addChiliForm">
            <v-text-field
              v-model="chiliData.name"
              label="Chili Name *"
              :placeholder="`e.g., ${randomChiliName}`"
              :rules="addChiliNameRules"
              :counter="50"
              required
              variant="outlined"
              class="mb-4"
            ></v-text-field>

            <v-text-field
              v-model="chiliData.cook"
              label="Your Name *"
              placeholder="Enter your name"
              :rules="addChiliCookRules"
              :counter="30"
              required
              variant="outlined"
              class="mb-4"
            ></v-text-field>

            <div class="text-center text-body-2 text-medium-emphasis">
              <v-icon icon="mdi-information" color="info" class="mr-1" size="small"></v-icon>
              Each person can only submit one chili to the contest
            </div>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4 d-flex flex-column flex-sm-row gap-2">
          <v-btn
            color="grey"
            variant="outlined"
            @click="closeAddChiliModal"
            :block="$vuetify.display.xs"
            class="flex-grow-1 flex-sm-grow-0"
          >
            Skip for Now
          </v-btn>
          <v-spacer class="d-none d-sm-block"></v-spacer>
          <v-btn
            color="primary"
            :loading="submittingChili"
            :disabled="!isAddChiliFormValid || submittingChili"
            @click="submitChili"
            prepend-icon="mdi-send"
            :block="$vuetify.display.xs"
            class="flex-grow-1 flex-sm-grow-0"
          >
            Submit My Chili
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { chiliApi } from '@/services/api'

export default {
  data() {
    return {
      selectedChili: null,
      chiliEntries: [], // Will be populated from API
      scores: {
        aroma: 0,
        appearance: 0,
        taste: 0,
        heatLevel: 0,
        creativity: 0
      },
      snackbar: {
        show: false,
        message: '',
        color: 'success'
      },
      hasVoted: false,
      previousScores: {}, // Track scores by chili number - stored in localStorage
      showZeroScoreWarning: false,
      zeroScoreData: null,
      activePanel: 0, // Controls which panel is currently expanded
     // Bonus round data
     bonusRoundActive: false,
     bonusScores: {}, // { chiliNumber: bonusPoints }
     totalBonusPoints: 0,
     maxBonusPoints: 10,
     judgeId: null,
     hasSubmittedBonus: false,
     scoresTable: [], // For tracking scores to determine ties
     
     // Add chili modal
     showAddChiliModal: false,
     chiliData: {
       name: '',
       cook: ''
     },
     submittingChili: false,
     contestantId: null,
     hasSubmittedChili: false,
     submittedChiliData: {},
     randomChiliName: '',
     addChiliNameRules: [
       v => !!v || 'Chili name is required',
       v => (v && v.length >= 3) || 'Chili name must be at least 3 characters',
       v => (v && v.length <= 50) || 'Chili name must be less than 50 characters'
     ],
     addChiliCookRules: [
       v => !!v || 'Your name is required',
       v => (v && v.length >= 2) || 'Name must be at least 2 characters',
       v => (v && v.length <= 30) || 'Name must be less than 30 characters'
     ]
    }
  },

  computed: {
    // Creates dropdown list of all available chilis from the database
    availableChilis() {
      return this.chiliEntries.map(chili => ({
        name: `Chili #${chili.number}${chili.name ? ` - ${chili.name}` : ''}`,
        number: chili.number,
        scored: this.hasChiliBeenScored(chili.number)
      }))
    },

    // For bonus round - all chilis available for bonus points
    bonusChilis() {
      if (!this.bonusRoundActive) return []
      
      // Get current scores from the scores table or admin data
      const chiliScores = new Map()
      
      // Use scores from admin view if available
      if (this.scoresTable && this.scoresTable.length > 0) {
        this.scoresTable.forEach(chili => {
          if (chili.avg_total_score && chili.avg_total_score > 0) {
            chiliScores.set(chili.number, parseFloat(chili.avg_total_score))
          }
        })
      }
      
      // If no scores available, return empty array
      if (chiliScores.size === 0) return []
      
      // Group chilis by their scores
      const scoreGroups = new Map()
      chiliScores.forEach((score, chiliNumber) => {
        const roundedScore = Math.round(score * 100) / 100 // Round to 2 decimal places
        if (!scoreGroups.has(roundedScore)) {
          scoreGroups.set(roundedScore, [])
        }
        scoreGroups.get(roundedScore).push(chiliNumber)
      })
      
      // Find tied chilis (groups with more than 1 chili)
      const tiedChiliNumbers = new Set()
      scoreGroups.forEach((chilis, score) => {
        if (chilis.length > 1) {
          chilis.forEach(chiliNumber => tiedChiliNumbers.add(chiliNumber))
        }
      })
      
      // Return only chilis that are tied, with isWinner flag
      return this.chiliEntries
        .filter(chili => tiedChiliNumbers.has(chili.number))
        .map(chili => ({
          ...chili,
          name: chili.name || `Chili #${chili.number}`,
          bonusPoints: this.bonusScores[chili.number] || 0,
          isWinner: true, // All tied chilis are potential winners
          currentScore: chiliScores.get(chili.number) || 0
        }))
    },

    // Check if user has scored all available chilis
    hasVotedOnAllChilis() {
      if (this.chiliEntries.length === 0) return false
      return this.chiliEntries.every(chili => this.hasChiliBeenScored(chili.number))
    },

    // Check if current chili has been scored (for readonly state)
    currentChiliAlreadyScored() {
      return this.selectedChili && this.hasChiliBeenScored(this.selectedChili)
    },

    // Form should be readonly if voted on all OR current chili already scored
    isFormReadonly() {
      return this.hasVotedOnAllChilis || this.currentChiliAlreadyScored
    },
    
    // Calculates total score across all 5 categories (max 50 points)
    totalScore() {
      return Object.values(this.scores).reduce((sum, score) => sum + (score || 0), 0)
    },

    // Form is valid if chili selected, all scores are numbers, and hasn't voted yet
    isFormValid() {
      return this.selectedChili && 
             Object.values(this.scores).every(score => typeof score === 'number') &&
             !this.hasVoted &&
             !this.isFormReadonly
    },

    // Checks if any category has a zero score
    hasZeroScores() {
      return Object.values(this.scores).some(score => score === 0)
    },

    // Returns comma-separated list of categories with zero scores
    zeroScoreCategories() {
      return Object.entries(this.scores)
        .filter(([_, value]) => value === 0)
        .map(([key, _]) => key.charAt(0).toUpperCase() + key.slice(1))
        .join(', ')
    },

    currentIndex() {
      return this.activePanel
    },

    showBackButton() {
      return this.currentIndex > 0
    },

    showNextButton() {
      return this.currentIndex < 4 // 5 panels total (0-4)
    },

    // Calculate remaining bonus points
    remainingBonusPoints() {
      return this.maxBonusPoints - this.totalBonusPoints
    },

    // Check if bonus submission is valid
    canSubmitBonus() {
      return this.totalBonusPoints <= this.maxBonusPoints && !this.hasSubmittedBonus
    },

    // Check if add chili form is valid
    isAddChiliFormValid() {
      return this.chiliData.name && 
             this.chiliData.cook && 
             this.chiliData.name.length >= 3 && 
             this.chiliData.cook.length >= 2
    }
  },

  watch: {
    // When user selects a different chili, load their previous scores for that chili if they exist
    selectedChili(newValue) {
      if (newValue) {
        const chili = this.chiliEntries.find(c => c.number === newValue)
        if (chili) {
          const chiliKey = `${newValue}_${chili.name || ''}_${chili.cook || ''}`
          if (this.previousScores[chiliKey]) {
            // Load previously saved scores for this chili
            this.scores = { ...this.previousScores[chiliKey] }
          } else {
            // Reset to zeros for new chili
            this.resetScores()
          }
        }
      } else {
        // Reset to zeros for new chili
        this.resetScores()
      }
      // Reset hasVoted flag when changing chili selection
      this.hasVoted = false
    },

    // Watch bonus scores for total calculation
    bonusScores: {
      handler(newScores) {
        this.totalBonusPoints = Object.values(newScores).reduce((sum, points) => sum + (points || 0), 0)
      },
      deep: true
    }
  },

  async created() {
    // Load all chili entries from the database when component is created
    await this.loadChilis()
    // Load any previously submitted scores from localStorage
    this.loadPreviousScoresFromStorage()
    // Generate judge ID and load bonus round status
    this.judgeId = this.generateJudgeId()
    await this.loadBonusRoundStatus()
    
    // Check chili submission status and show modal if needed
    this.contestantId = this.generateContestantId()
    await this.checkChiliSubmissionStatus()
    
    // Generate random chili name suggestion
    this.generateRandomChiliName()
    
    // Show add chili modal on first visit if no chili submitted
    if (!this.hasSubmittedChili) {
      this.showAddChiliModal = true
    }
  },

  methods: {
    // Fetches all chili entries from the backend API
    async loadChilis() {
      try {
        const { data } = await chiliApi.getAll()
        this.chiliEntries = Array.isArray(data) ? data : []
        console.log('Loaded chilis:', this.chiliEntries)
      } catch (error) {
        console.error('Error loading chilis:', error)
        this.chiliEntries = []
      }
    },

    // Handles form submission - checks for zero scores first, then saves
    async submitVote() {
      if (!this.isFormValid) return

      // If any scores are zero, show warning dialog before submitting
      if (this.hasZeroScores) {
        this.zeroScoreData = {
          timestamp: new Date().toISOString(),
          chiliNumber: this.selectedChili,
          ...this.scores,
          totalScore: this.totalScore
        }
        this.showZeroScoreWarning = true
        return
      }

      // No zeros, proceed with submission
      await this.saveScores()
    },

    // Actually saves scores to backend and localStorage
    async saveScores() {
      try {
        // Submit scores to backend API
        await chiliApi.submitScore({
          chili_id: this.selectedChili,
          aroma: this.scores.aroma,
          appearance: this.scores.appearance,
          taste: this.scores.taste,
          heat_level: this.scores.heatLevel,
          creativity: this.scores.creativity,
          total_score: this.totalScore
        })

        // Save scores to localStorage so user can see they've scored this chili
        this.savePreviousScoresToStorage()
        
        // Show success snackbar
        this.snackbar = {
          show: true,
          message: `Scores submitted for Chili #${this.selectedChili}!`,
          color: 'success'
        }
        this.hasVoted = true
        
        // Auto-advance to next unscored chili
        this.advanceToNextChili()
        
        console.log('Scores submitted successfully')
      } catch (error) {
        console.error('Error submitting scores:', error)
        this.snackbar = {
          show: true,
          message: 'Failed to submit scores. Please try again.',
          color: 'error'
        }
      }
    },

    // Find and select the next unscored chili
    advanceToNextChili() {
      const currentIndex = this.chiliEntries.findIndex(chili => chili.number === this.selectedChili)
      
      // Look for next unscored chili starting from current position
      for (let i = currentIndex + 1; i < this.chiliEntries.length; i++) {
        const chili = this.chiliEntries[i]
        if (!this.hasChiliBeenScored(chili.number)) {
          this.selectedChili = chili.number
          this.activePanel = 0 // Reset to first scoring panel
          return
        }
      }
      
      // If no unscored chilis after current, look from beginning
      for (let i = 0; i < currentIndex; i++) {
        const chili = this.chiliEntries[i]
        if (!this.hasChiliBeenScored(chili.number)) {
          this.selectedChili = chili.number
          this.activePanel = 0
          return
        }
      }
      
      // All chilis scored - clear selection
      this.selectedChili = null
    },

    // User confirmed they want to submit despite zero scores
    async confirmSubmitWithZeros() {
      this.showZeroScoreWarning = false
      await this.saveScores()
    },

    // Generate unique judge ID
    generateJudgeId() {
     const stored = localStorage.getItem('judgeId')
     if (stored) return stored
     
     const id = 'judge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
     localStorage.setItem('judgeId', id)
     return id
   },

   // Load bonus round status
   async loadBonusRoundStatus() {
     try {
       const { data } = await chiliApi.getBonusRoundStatus()
       this.bonusRoundActive = data.bonus_round_active
       
       // If bonus round is active, load scores for tie detection
       if (this.bonusRoundActive) {
         await this.loadScoresForTieDetection()
       }
       
       // Check if already submitted bonus scores
       const submittedKey = `bonus_submitted_${this.judgeId}`
       this.hasSubmittedBonus = localStorage.getItem(submittedKey) === 'true'
       
       console.log('Bonus round status:', {
        bonusRoundActive: this.bonusRoundActive,
        hasSubmittedBonus: this.hasSubmittedBonus,
        judgeId: this.judgeId
      })
     } catch (error) {
       console.error('Error loading bonus round status:', error)
     }
   },

   // Load scores for tie detection
   async loadScoresForTieDetection() {
     try {
       // Try final scores first, fallback to regular scores
       try {
         const { data } = await chiliApi.getFinalScores()
         this.scoresTable = Array.isArray(data) ? data : []
       } catch (finalScoresError) {
         const { data } = await chiliApi.getAllScores()
         this.scoresTable = Array.isArray(data) ? data : []
       }
       
       console.log('Scores loaded for tie detection:', this.scoresTable)
     } catch (error) {
       console.error('Error loading scores for tie detection:', error)
       this.scoresTable = []
     }
   },

    // Update bonus points for a chili
    updateBonusPoints(chiliNumber, points) {
      let newPoints = Math.max(0, Math.min(10, points || 0))
      const currentTotal = Object.values(this.bonusScores).reduce((sum, p) => sum + (p || 0), 0)
      const otherTotal = currentTotal - (this.bonusScores[chiliNumber] || 0)
      
      // Don't allow exceeding max points
      if (otherTotal + newPoints > this.maxBonusPoints) {
        newPoints = this.maxBonusPoints - otherTotal
      }
      
      this.bonusScores[chiliNumber] = newPoints
    },

    // Submit bonus scores
    async submitBonusScores() {
      try {
        const bonusArray = Object.entries(this.bonusScores)
          .filter(([_, points]) => points > 0)
          .map(([chiliId, bonusPoints]) => ({ 
            chili_id: parseInt(chiliId), 
            bonus_points: bonusPoints 
          }))

        await chiliApi.submitBonusScores({
          bonus_scores: bonusArray,
          judge_id: this.judgeId
        })

        // Mark as submitted
        this.hasSubmittedBonus = true
        localStorage.setItem(`bonus_submitted_${this.judgeId}`, 'true')

        this.snackbar = {
          show: true,
          message: `Bonus points submitted! Total: ${this.totalBonusPoints} points`,
          color: 'success'
        }

        console.log('Bonus scores submitted successfully')
      } catch (error) {
        console.error('Error submitting bonus scores:', error)
        this.snackbar = {
          show: true,
          message: 'Failed to submit bonus scores. Please try again.',
          color: 'error'
        }
      }
    },

    // Checks if user has already scored a specific chili (checks localStorage)
    hasChiliBeenScored(chiliNumber) {
      // Check if we have scores for this exact chili (by number and metadata)
      const chili = this.chiliEntries.find(c => c.number === chiliNumber)
      if (!chili) return false
      
      const chiliKey = `${chiliNumber}_${chili.name || ''}_${chili.cook || ''}`
      return !!this.previousScores[chiliKey]
    },

    // Loads previously submitted scores from localStorage
    loadPreviousScoresFromStorage() {
      try {
        const saved = localStorage.getItem('chiliScores')
        if (saved) {
          this.previousScores = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Error loading previous scores:', error)
        this.previousScores = {}
      }
    },

    // Saves current scores to localStorage for the selected chili
    savePreviousScoresToStorage() {
      try {
        const chili = this.chiliEntries.find(c => c.number === this.selectedChili)
        if (chili) {
          const chiliKey = `${this.selectedChili}_${chili.name || ''}_${chili.cook || ''}`
          this.previousScores[chiliKey] = { ...this.scores }
        }
        localStorage.setItem('chiliScores', JSON.stringify(this.previousScores))
      } catch (error) {
        console.error('Error saving previous scores:', error)
      }
    },

    // Resets all score values to zero
    resetScores() {
      this.scores = {
        aroma: 0,
        appearance: 0,
        taste: 0,
        heatLevel: 0,
        creativity: 0
      }
      this.activePanel = 0 // Reset to first panel
    },

    // Resets entire form after successful submission
    resetForm() {
      this.selectedChili = null
      this.resetScores()
      this.hasVoted = false
      this.snackbar.show = false
      this.showZeroScoreWarning = false
      this.loadChilis() // Reload chilis in case new ones were added
    },

    // Debug method to force scores (for testing)
    async forceScores() {
      this.scores = {
        aroma: 10,
        appearance: 10,
        taste: 10,
        heatLevel: 10,
        creativity: 10
      }
      await this.submitVote()
    },

    // Get next section name for navigation button
    getNextSection() {
     const sections = ['Aroma', 'Appearance', 'Taste', 'Heat Level', 'Creativity']
     return sections[this.currentIndex + 1] || ''
    },
    
    // Get previous section name for navigation button
    getPreviousSection() {
     const sections = ['Aroma', 'Appearance', 'Taste', 'Heat Level', 'Creativity']
     return sections[this.currentIndex - 1] || ''
    },

    // Generate unique contestant ID for chili submission
    generateContestantId() {
      const stored = localStorage.getItem('contestantId')
      if (stored) return stored
      
      const id = 'contestant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('contestantId', id)
      return id
    },

    // Check if user has already submitted a chili
    async checkChiliSubmissionStatus() {
      try {
        const submittedData = localStorage.getItem(`chili_submitted_${this.contestantId}`)
        if (submittedData) {
          this.submittedChiliData = JSON.parse(submittedData)
          this.hasSubmittedChili = true
        }
      } catch (error) {
        console.error('Error checking chili submission status:', error)
      }
    },

    // Submit chili to the contest
    async submitChili() {
      if (!this.isAddChiliFormValid || this.submittingChili) return

      // Validate form
      const { valid } = await this.$refs.addChiliForm.validate()
      if (!valid) return

      this.submittingChili = true

      try {
        // Get the next chili number
        const nextNumber = await this.getNextChiliNumber()

        // Prepare chili data
        const chiliPayload = {
          number: nextNumber,
          name: this.chiliData.name.trim(),
          cook: this.chiliData.cook.trim(),
          contestant_id: this.contestantId
        }

        // Submit to database
        await chiliApi.create(chiliPayload)

        // Save to localStorage to prevent duplicate submissions
        const submittedData = {
          number: nextNumber,
          name: chiliPayload.name,
          cook: chiliPayload.cook,
          submittedAt: new Date().toISOString()
        }
        localStorage.setItem(`chili_submitted_${this.contestantId}`, JSON.stringify(submittedData))

        // Update UI state
        this.hasSubmittedChili = true
        this.submittedChiliData = submittedData
        this.showAddChiliModal = false

        // Reload chilis to include the new one
        await this.loadChilis()

        // Show success message
        this.snackbar = {
          show: true,
          message: 'Your chili has been successfully submitted to the contest!',
          color: 'success'
        }

        console.log('Chili submitted successfully:', chiliPayload)

      } catch (error) {
        console.error('Error submitting chili:', error)
        
        // Show error message
        this.snackbar = {
          show: true,
          message: 'Failed to submit chili. Please try again.',
          color: 'error'
        }

        // If it's a duplicate entry error, mark as submitted anyway
        if (error.response?.status === 409 || error.message?.includes('duplicate')) {
          this.hasSubmittedChili = true
          this.showAddChiliModal = false
          this.snackbar.message = 'You have already submitted a chili to this contest.'
        }
      } finally {
        this.submittingChili = false
      }
    },

    // Get the next available chili number
    async getNextChiliNumber() {
      try {
        const { data } = await chiliApi.getAll()
        const existingNumbers = data.map(chili => chili.number)
        const maxNumber = Math.max(0, ...existingNumbers)
        return maxNumber + 1
      } catch (error) {
        console.error('Error getting chili numbers:', error)
        // Fallback: use timestamp-based number
        return Math.floor(Date.now() / 1000)
      }
    },

    // Close add chili modal
    closeAddChiliModal() {
      this.showAddChiliModal = false
    },

    // Generate a random chili name suggestion
    generateRandomChiliName() {
      const adjectives = [
        'Fire', 'Blazing', 'Thunder', 'Lightning', 'Dragon', 'Phoenix', 'Midnight', 'Smoky',
        'Volcanic', 'Inferno', 'Spicy', 'Wild', 'Savage', 'Burning', 'Flaming', 'Scorching',
        'Molten', 'Searing', 'Crimson', 'Golden', 'Secret', 'Mystery', 'Ultimate', 'Supreme',
        'Legendary', 'Epic', 'Atomic', 'Nuclear', 'Turbo', 'Super', 'Mega', 'Power', 'Killer',
        'Death', 'Venom', 'Poison', 'Toxic', 'Deadly', 'Sweet', 'Honey', 'Maple', 'Brown Sugar'
      ]
      
      const nouns = [
        'Dragon', 'Thunder', 'Lightning', 'Venom', 'Heat', 'Burn', 'Blast', 'Storm', 'Fury',
        'Rage', 'Power', 'Force', 'Magic', 'Spell', 'Potion', 'Elixir', 'Brew', 'Mix', 'Blend',
        'Recipe', 'Special', 'Secret', 'Surprise', 'Twist', 'Kick', 'Punch', 'Explosion', 'Bomb',
        'Volcano', 'Lava', 'Magma', 'Fire', 'Flame', 'Ember', 'Spark', 'Glow', 'Shine', 'Burst',
        'Rush', 'Wave', 'Tide', 'Flood', 'River', 'Stream', 'Flow', 'Current', 'Wind', 'Breeze'
      ]
      
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
      
      this.randomChiliName = `${randomAdjective} ${randomNoun}`
    }
  }
}
</script>

<style scoped>
.v-snackbar {
  top: 20px !important;
  right: 20px !important;
  left: auto !important;
  width: 300px;
}
</style>
