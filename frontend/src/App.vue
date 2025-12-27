<script>
import logoImage from '@/assets/images/chili-logo-transparent_resized.png'

export default {
  name: 'App',
  data() {
    return {
      logoImage
    }
  }
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-img
        :src="logoImage"
        :height="48"
        :width="48"
        contain
        class="mr-3"
      ></v-img>
      <v-spacer></v-spacer>
      
      <v-btn 
        to="/vote" 
        variant="text"
        :class="{ 'v-btn--active': $route.name === 'vote' }"
      >
        <v-icon>mdi-vote</v-icon>
        Vote
      </v-btn>
      
      <v-btn 
        to="/add-chili" 
        variant="text"
        :class="{ 'v-btn--active': $route.name === 'add-chili' }"
      >
        <v-icon>mdi-plus</v-icon>
        Add Chili
      </v-btn>
      
      <v-btn 
        to="/admin" 
        variant="text"
        :class="{ 'v-btn--active': $route.name === 'admin' }"
      >
        <v-icon>mdi-cog</v-icon>
        Admin
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>