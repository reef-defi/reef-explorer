<template>
  <div>
    <Header
      :mobile-menu-open="mobileMenuOpen"
      @toggle-mobile-menu="mobileMenuOpen = $event"
    />
    <Nuxt />
    <Footer />
    <NavPanel
      :mobile-menu-open="mobileMenuOpen"
      @toggle-mobile-menu="mobileMenuOpen = $event"
    />
  </div>
</template>

<script>
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import NavPanel from '@/components/NavPanel.vue'

export default {
  name: 'Index',
  components: {
    Header,
    Footer,
    NavPanel,
  },
  data() {
    return {
      mobileMenuOpen: false,
    }
  },
}
</script>
