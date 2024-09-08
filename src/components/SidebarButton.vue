<script lang="ts" setup>
export interface SidebarButtonProps {
	iconPath: string
	small?: boolean
}

withDefaults(defineProps<SidebarButtonProps>(), { small: false })
</script>

<template>
	<button
		class="rounded-full text-2xl text-white transition-[background-color,transform] active:scale-95 disabled:opacity-50 disabled:hover:cursor-not-allowed"
		:class="small ? 'p-2' : 'p-4'"
		@dblclick.stop
		@mousedown.stop
		@touchstart.stop
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			class="size-6"
			fill="currentColor"
		>
			<path :d="iconPath" />
		</svg>
	</button>
</template>
