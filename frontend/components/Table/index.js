import Vue from 'vue'

import Table from './Table.vue'
import Row from './Row.vue'
import Cell from './Cell.vue'

const components = [Table, Row, Cell]

components.forEach((component) => Vue.component(component.name, component))
