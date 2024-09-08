import type { Point } from './types'

export const getCoordinatesRelativeToImage = (
	pageX: number,
	pageY: number,
	zoomFactor: number,
	imageEl: HTMLImageElement,
): Point => {
	const { left, top } = imageEl.getBoundingClientRect()

	const absX = pageX - left - window.scrollX
	const absY = pageY - top - window.scrollY

	const relX =
		((absX / imageEl.clientWidth) * imageEl.naturalWidth) / zoomFactor
	const relY =
		((absY / imageEl.clientHeight) * imageEl.naturalHeight) / zoomFactor

	return [relX, relY]
}

export const normalizeCoordinates = (
	x: number,
	y: number,
	imageEl: HTMLImageElement,
): Point => {
	const nX = x * (imageEl.clientWidth / imageEl.naturalWidth)
	const nY = y * (imageEl.clientHeight / imageEl.naturalHeight)
	const dpr = window.devicePixelRatio || 1

	return [nX * dpr, nY * dpr]
}

// https://www.eecs.umich.edu/courses/eecs380/HANDOUTS/PROJ2/InsidePoly.html
export const pointInPolygon = (x: number, y: number, vertices: Point[]) => {
	let c = false

	for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
		if (
			((vertices[i][1] <= y && y < vertices[j][1]) ||
				(vertices[j][1] <= y && y < vertices[i][1])) &&
			x <
				((vertices[j][0] - vertices[i][0]) * (y - vertices[i][1])) /
					(vertices[j][1] - vertices[i][1]) +
					vertices[i][0]
		)
			c = !c
	}

	return c
}

export const pointInPolygons = (x: number, y: number, polygons: Point[][]) => {
	for (let i = 0; i < polygons.length; i++) {
		if (pointInPolygon(x, y, polygons[i])) return i
	}

	return null
}
