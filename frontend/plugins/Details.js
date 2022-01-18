import Vue from 'vue'

import Card from '@/components/Details/Card.vue'
import Data from '@/components/Details/Data.vue'
import Tabs from '@/components/Details/Tabs.vue'
import Headline from '@/components/Details/Headline.vue'

const components = [Card, Data, Tabs, Headline]

components.forEach((component) => Vue.component(component.name, component))
