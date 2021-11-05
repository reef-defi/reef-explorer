import Vue from 'vue'

import Table from './Table.vue'
import THead from './THead.vue'
import Row from './Row.vue'
import Cell from './Cell.vue'
import PerPage from './PerPage.vue'

const components = [Table, THead, Row, Cell, PerPage]

components.forEach((component) => Vue.component(component.name, component))
