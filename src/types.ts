import type { RemovableRef } from '@vueuse/core'
import type { PanZoom } from 'panzoom'
import type { ComponentInstance, Ref, ShallowRef } from 'vue'
import type OverlayCanvas from './components/OverlayCanvas.vue'

export interface State {
	devPolyMode: Ref<boolean>
	canvas: Ref<ComponentInstance<typeof OverlayCanvas> | undefined>
	imageEl: Ref<HTMLImageElement | undefined>
	currentTargetIndexOrUrl: Ref<number | string>
	panzoomInstance: ShallowRef<PanZoom | undefined>
	solvedTargets: RemovableRef<Record<number, SolvedTarget>>
	resetPanzoom: () => void
}

export type Point = [x: number, y: number]

export type Target = [name: string, credit: string, polygons: Point[][]]

/**
 *        1 => Fully solved

 * number[] => Partially solved; each number is a polygon index
 *             that has been found
 */
export type SolvedTarget = 1 | number[]
