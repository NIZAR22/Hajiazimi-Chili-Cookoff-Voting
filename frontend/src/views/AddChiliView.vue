<template>
  <v-container max-width="600px">
    <v-card class="mb-4">
      <v-card-title class="text-h4 text-sm-h3 text-break text-wrap pa-4">
        <div class="d-flex align-center">
          <v-icon icon="mdi-chili-hot" color="primary" class="mr-2"></v-icon>
          <span class="text-h5 text-sm-h4">Submit Your Chili</span>
        </div>
      </v-card-title>
      <v-card-subtitle class="text-wrap">
        Enter your chili into the competition
      </v-card-subtitle>
      
      <v-card-text>
        <!-- Already submitted message -->
        <v-alert v-if="hasSubmitted" type="success" class="mb-4">
          <div class="d-flex align-center">
            <div>
              <strong>Chili Submitted Successfully!</strong>
              <div class="text-body-2 mt-1">
                Your chili "{{ submittedChili.name }}" by {{ submittedChili.cook }} has been entered into the competition.
                You cannot submit another chili.
              </div>
            </div>
          </div>
        </v-alert>

        <!-- Submission form -->
        <v-form v-else @submit.prevent="submitChili" ref="form">
          <v-text-field
            v-model="chiliData.name"
            label="Chili Name *"
            placeholder="e.g., Fire Dragon Special"
            :rules="nameRules"
            required
            variant="outlined"
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="chiliData.cook"
            label="Your Name *"
            placeholder="Enter your name"
            :rules="cookRules"
            required
            variant="outlined"
            class="mb-4"
          ></v-text-field>

          <v-card-actions class="pa-0">
            <v-spacer></v-spacer>
            <v-btn
              type="submit"
              color="primary"
              size="large"
              :loading="submitting"
              :disabled="!isFormValid || submitting"
              prepend-icon="mdi-send"
            >
              Submit My Chili
            </v-btn>
          </v-card-actions>
        </v-form>

        <!-- Contest info -->
        <v-divider class="my-6"></v-divider>
        
        <div class="text-center">
          <v-icon icon="mdi-information" color="info" class="mr-2"></v-icon>
          <span class="text-body-2 text-medium-emphasis">
            Each person can only submit one chili to the contest
          </span>
        </div>
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
  </v-container>
</template>

<script>
import { chiliApi } from '@/services/api'

export default {
  name: 'AddChiliView',
  data() {
    return {
      chiliData: {
        name: '',
        cook: ''
      },
      submitting: false,
      hasSubmitted: false,
      submittedChili: {},
      contestantId: null,
      snackbar: {
        show: false,
        message: '',
        color: 'success'
      },
      nameRules: [
        v => !!v || 'Chili name is required',
        v => (v && v.length >= 3) || 'Chili name must be at least 3 characters',
        v => (v && v.length <= 50) || 'Chili name must be less than 50 characters'
      ],
      cookRules: [
        v => !!v || 'Your name is required',
        v => (v && v.length >= 2) || 'Name must be at least 2 characters',
        v => (v && v.length <= 30) || 'Name must be less than 30 characters'
      ]
    }
  },

  computed: {
    isFormValid() {
      return this.chiliData.name && 
             this.chiliData.cook && 
             this.chiliData.name.length >= 3 && 
             this.chiliData.cook.length >= 2
    }
  },

  async created() {
    // Generate unique contestant ID
    this.contestantId = this.generateContestantId()
    
    // Check if user has already submitted
    await this.checkSubmissionStatus()
  },

  methods: {
    // Generate unique contestant ID
    generateContestantId() {
      const stored = localStorage.getItem('contestantId')
      if (stored) return stored
      
      const id = 'contestant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('contestantId', id)
      return id
    },

    // Check if user has already submitted a chili
    async checkSubmissionStatus() {
      try {
        // Check localStorage first for quick response
        const submittedData = localStorage.getItem(`chili_submitted_${this.contestantId}`)
        if (submittedData) {
          this.submittedChili = JSON.parse(submittedData)
          this.hasSubmitted = true
          return
        }

        // TODO:
        // Also check database to be extra sure
        // This would require a new API endpoint to check by contestant ID
        // For now, we'll rely on localStorage
        
      } catch (error) {
        console.error('Error checking submission status:', error)
      }
    },

    // Submit chili to the contest
    async submitChili() {
      if (!this.isFormValid || this.submitting) return

      // Validate form
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      this.submitting = true

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
        this.hasSubmitted = true
        this.submittedChili = submittedData

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
          this.hasSubmitted = true
          this.snackbar.message = 'You have already submitted a chili to this contest.'
        }
      } finally {
        this.submitting = false
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