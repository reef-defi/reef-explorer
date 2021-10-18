import Vue from 'vue'

import Table from './Table.vue'
import THead from './THead.vue'
import Row from './Row.vue'
import Cell from './Cell.vue'

const components = [Table, THead, Row, Cell]

components.forEach((component) => Vue.component(component.name, component))
