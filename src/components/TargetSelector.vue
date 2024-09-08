<script lang="ts" setup>
import { computed, inject, ref } from 'vue'
import { STATE_KEY } from '../constants'
import untypedTargets from '../targets.json'
import type { Target } from '../types'
import TargetButton from './TargetButton.vue'

const targets = untypedTargets as Target[]
const { currentTargetIndexOrUrl, solvedTargets, canvas } = inject(STATE_KEY)!

const emit = defineEmits<{ giveUp: []; targetSelected: [index: number] }>()

const hoveringIndex = ref<number | null>(null)
const currentTargetDisplay = computed(() => {
	if (hoveringIndex.value == null)
		return targets[currentTargetIndexOrUrl.value as number]
	else return targets[hoveringIndex.value]
})
const confirmingResetAll = ref(false)

const resetCurrent = () => {
	delete solvedTargets.value[currentTargetIndexOrUrl.value as number]

	canvas.value?.clear()
	emit('targetSelected', currentTargetIndexOrUrl.value as number)
}

const resetAll = () => {
	if (!confirmingResetAll.value) {
		confirmingResetAll.value = true
		return
	}

	solvedTargets.value = {}

	emit('targetSelected', 0)
}
</script>

<template>
	<h2 class="text-center text-2xl">
		<span>Find the </span>
		<span class="font-bold">
			{{ currentTargetDisplay[0] ?? '???' }}
		</span>
	</h2>

	<p class="text-center text-sm text-gray-400">
		Image credit:
		<a
			:href="`https://www.reddit.com/user/${currentTargetDisplay[1]}/`"
			class="underline"
			target="_blank"
			rel="noreferrer"
			>/u/{{ currentTargetDisplay[1] }}</a
		>
	</p>

	<div class="mt-4 text-center">
		<button
			v-if="solvedTargets[currentTargetIndexOrUrl as number] !== 1"
			@click="$emit('giveUp')"
			class="rounded-md border-2 border-neutral-700 px-3 py-2 font-medium transition-colors hover:bg-neutral-600"
		>
			I give up :&lpar;
		</button>
	</div>

	<div
		class="mb-8 mt-6 grid grid-cols-[repeat(auto-fit,minmax(48px,1fr))] gap-4"
	>
		<TargetButton
			v-for="(_, index) in targets"
			@click="$emit('targetSelected', index)"
			@mouseenter="hoveringIndex = index"
			@mouseleave="hoveringIndex = null"
			class="col-span-1"
			:index
		/>
	</div>

	<div class="flex flex-col sm:flex-row">
		<button
			@click="resetCurrent"
			class="mb-3 rounded-md border-2 border-neutral-700 px-3 py-2 font-medium transition-colors hover:bg-neutral-600 sm:mb-0 sm:mr-3"
		>
			Reset current
		</button>

		<button
			@click="resetAll"
			class="rounded-md border-2 border-red-500 px-3 py-2 font-medium transition-colors hover:bg-neutral-700"
		>
			{{ confirmingResetAll ? 'Click again to confirm' : 'Reset all' }}
		</button>
	</div>
</template>
