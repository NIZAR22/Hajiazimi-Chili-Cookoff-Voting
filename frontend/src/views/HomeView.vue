<script>
import chiliVotingImage from "@/assets/images/chili-voting.png";
import logoImage from "@/assets/images/chili-logo-transparent-banner2.png";

export default {
  data() {
    return {
      chiliVotingImage,
      logoImage,
    };
  },
};
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h5 text-sm-h6 text-break text-wrap pa-4">
            <div class="mb-4">
              Welcome to...
            </div>
            <v-img
              :src="logoImage"
              height="300"
              cover
            ></v-img>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card height="100%">
          <v-img :src="chiliVotingImage" height="200" cover class="align-end">
            <v-card-title class="text-white bg-black bg-opacity-50 text-break">
              Judge a Chili
            </v-card-title>
          </v-img>
          <v-card-text>
            Score chili's based on aroma, appearance, taste, heat level, and
            creativity.
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" to="/voting" block size="large">
              Vote Now
              <v-icon end icon="mdi-arrow-right"></v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card height="100%">
          <v-img
            src="https://images.unsplash.com/photo-1621916805571-2e804f82170c?auto=format&fit=crop&w=800"
            height="200"
            cover
            class="align-end"
          >
            <v-card-title class="text-white bg-black bg-opacity-50">
              Admin Panel
            </v-card-title>
          </v-img>
          <v-card-text>
            Manage the competition, set up chili entries, and view results.
          </v-card-text>
          <v-card-actions>
            <v-btn color="secondary" to="/admin" block size="large">
              Admin Access
              <v-icon end icon="mdi-cog"></v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
