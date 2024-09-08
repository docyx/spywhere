<script lang="ts" setup>
import { computed, inject } from 'vue'
import { STATE_KEY } from '../constants'

export interface TargetButtonProps {
	index: number
}

const { index } = defineProps<TargetButtonProps>()

const { currentTargetIndexOrUrl, solvedTargets } = inject(STATE_KEY)!

const classes = computed(() => {
	const solved = solvedTargets.value?.[index]

	if (solved === 1) {
		return 'bg-green-500 hover:bg-green-400 text-black'
	} else if (Array.isArray(solved)) {
		return 'bg-yellow-500 hover:bg-yellow-400 text-black'
	} else {
		return 'bg-neutral-600 hover:bg-neutral-500 text-white'
	}
})
</script>

<template>
	<button
		class="size-12 rounded-full text-xl transition-colors"
		:class="currentTargetIndexOrUrl === index ? 'bg-white text-black' : classes"
	>
		{{ (index + 1).toString().padStart(2, '0') }}
	</button>
</template>
