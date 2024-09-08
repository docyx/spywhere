<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core'
import { ref } from 'vue'

export interface TargetSelectorProps {
	show: boolean
}

const { show } = defineProps<TargetSelectorProps>()

const emit = defineEmits<{ close: [] }>()

const modalEl = ref<HTMLDivElement>()

onClickOutside(modalEl, () => emit('close'))

window.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') emit('close')
})
</script>

<template>
	<Teleport to="body">
		<Transition name="modal">
			<div
				v-if="show"
				class="fixed left-0 top-0 z-50 flex h-dvh w-screen items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity"
			>
				<div
					class="modal-inner m-2 w-full max-w-lg grid-cols-8 gap-4 rounded-md bg-neutral-800 p-4 transition-transform"
					ref="modalEl"
				>
					<slot />
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style>
.modal-enter-from {
	opacity: 0;
}

.modal-leave-to {
	opacity: 0;
}

.modal-enter-from .modal-inner,
.modal-leave-to .modal-inner {
	@apply scale-110;
}
</style>
