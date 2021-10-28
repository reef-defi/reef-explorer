import Vue from 'vue'

import Card from './Card.vue'
import Data from './Data.vue'
import Tabs from './Tabs.vue'
import Headline from './Headline.vue'

import '@/components/Table'

const components = [Card, Data, Tabs, Headline]

components.forEach((component) => Vue.component(component.name, component))
