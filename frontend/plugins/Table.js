import Vue from 'vue'

import Table from '@/components/Table/Table.vue'
import THead from '@/components/Table/THead.vue'
import Row from '@/components/Table/Row.vue'
import Cell from '@/components/Table/Cell.vue'
import PerPage from '@/components/Table/PerPage.vue'

const components = [Table, THead, Row, Cell, PerPage]

components.forEach((component) => Vue.component(component.name, component))
