<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const showStillLoading = ref(false)

onMounted(() => {
	const start = Date.now()

	const interval = setInterval(() => {
		if (showStillLoading.value) clearInterval(interval)

		if (Date.now() - 3000 > start) showStillLoading.value = true
	}, 1000)
})
</script>

<template>
	<div class="flex flex-col items-center">
		<span class="loader"></span>

		<p
			class="mt-3 text-center text-sm text-neutral-300"
			:class="showStillLoading ? 'visible' : 'invisible'"
		>
			It's a big image. Sorry for the wait!
		</p>
	</div>
</template>

<!-- https://github.com/vineethtrv/css-loader -->
<style scoped>
.loader {
	width: 64px;
	height: 64px;
	position: relative;
	background: #fff;
	border-radius: 4px;
	overflow: hidden;
}

.loader:before {
	content: '';
	position: absolute;
	left: 0;
	bottom: 0;
	width: 40px;
	height: 40px;
	transform: rotate(45deg) translate(30%, 40%);
	background: theme(colors.blue.400);
	box-shadow: 32px -34px 0 5px theme(colors.blue.500);
	animation: slide 2s ease-in-out -1s infinite alternate;
	animation-fill-mode: both;
}

.loader:after {
	content: '';
	position: absolute;
	left: 10px;
	top: 10px;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: theme(colors.yellow.500);
	transform: rotate(0deg);
	transform-origin: 35px 145px;
	animation: rotate 2s ease-in-out -1s infinite;
	animation-fill-mode: both;
}

@keyframes slide {
	0%,
	100% {
		bottom: -35px;
	}
	25%,
	75% {
		bottom: -2px;
	}
	20%,
	80% {
		bottom: 2px;
	}
}

@keyframes rotate {
	0% {
		transform: rotate(-15deg);
	}
	25%,
	75% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(25deg);
	}
}
</style>
