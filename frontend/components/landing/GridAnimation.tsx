'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Substation {
  x: number
  y: number
  size: number
  pulsePhase: number
  type: 'major' | 'minor' | 'solar' | 'wind'
  connections: number[]
  energy: number
  maxEnergy: number
}

interface EnergyPacket {
  fromNode: number
  toNode: number
  progress: number
  speed: number
  color: string
}

// Kimi-style lime color palette (hex for alpha concatenation)
const LIME_COLOR = '#C8FF32'
const LIME_GLOW = '#C8FF324D'

export function GridAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const substationsRef = useRef<Substation[]>([])
  const packetsRef = useRef<EnergyPacket[]>([])

  const initializeGrid = useCallback((width: number, height: number) => {
    const substations: Substation[] = []
    const gridCols = 8
    const gridRows = 6
    const cellWidth = width / gridCols
    const cellHeight = height / gridRows

    // Create grid-aligned substations
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        // Skip some positions for organic feel
        if (Math.random() < 0.35) continue

        const jitterX = (Math.random() - 0.5) * cellWidth * 0.5
        const jitterY = (Math.random() - 0.5) * cellHeight * 0.5

        const x = (col + 0.5) * cellWidth + jitterX
        const y = (row + 0.5) * cellHeight + jitterY

        // Determine node type based on position
        const types: Array<'major' | 'minor' | 'solar' | 'wind'> = ['major', 'minor', 'solar', 'wind']
        const typeWeights = [0.15, 0.45, 0.25, 0.15]
        const rand = Math.random()
        let cumulative = 0
        let type: 'major' | 'minor' | 'solar' | 'wind' = 'minor'
        for (let i = 0; i < types.length; i++) {
          cumulative += typeWeights[i]
          if (rand < cumulative) {
            type = types[i]
            break
          }
        }

        substations.push({
          x,
          y,
          size: type === 'major' ? 6 : type === 'minor' ? 4 : 3,
          pulsePhase: Math.random() * Math.PI * 2,
          type,
          connections: [],
          energy: Math.random() * 100,
          maxEnergy: 100,
        })
      }
    }

    // Create connections (transmission lines)
    const maxDistance = Math.min(width, height) * 0.25
    for (let i = 0; i < substations.length; i++) {
      const neighbors: { index: number; distance: number }[] = []

      for (let j = 0; j < substations.length; j++) {
        if (i === j) continue
        const dx = substations[i].x - substations[j].x
        const dy = substations[i].y - substations[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance) {
          neighbors.push({ index: j, distance })
        }
      }

      // Connect to nearest 2-4 neighbors
      neighbors.sort((a, b) => a.distance - b.distance)
      const connectionCount = Math.min(2 + Math.floor(Math.random() * 3), neighbors.length)

      for (let k = 0; k < connectionCount; k++) {
        if (!substations[i].connections.includes(neighbors[k].index)) {
          substations[i].connections.push(neighbors[k].index)
        }
        if (!substations[neighbors[k].index].connections.includes(i)) {
          substations[neighbors[k].index].connections.push(i)
        }
      }
    }

    substationsRef.current = substations
    packetsRef.current = []
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      initializeGrid(rect.width, rect.height)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let time = 0

    // Kimi-style lime colors (hex format for alpha concatenation)
    const colors = {
      lineBase: '#C8FF3214',
      lineActive: '#C8FF3240',
      nodeMajor: LIME_COLOR,
      nodeMinor: '#C8FF32B3',
      nodeSolar: '#F59E0B',
      nodeWind: '#22D3EE',
      glow: LIME_GLOW,
      packet: LIME_COLOR,
    }

    const animate = () => {
      time += 0.016 // ~60fps
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      ctx.clearRect(0, 0, width, height)

      const substations = substationsRef.current
      const packets = packetsRef.current

      // Spawn new energy packets occasionally
      if (Math.random() < 0.03 && substations.length > 0) {
        const fromIdx = Math.floor(Math.random() * substations.length)
        const from = substations[fromIdx]
        if (from.connections.length > 0) {
          const toIdx = from.connections[Math.floor(Math.random() * from.connections.length)]
          packets.push({
            fromNode: fromIdx,
            toNode: toIdx,
            progress: 0,
            speed: 0.008 + Math.random() * 0.012,
            color: from.type === 'solar' ? colors.nodeSolar :
                   from.type === 'wind' ? colors.nodeWind :
                   colors.packet,
          })
        }
      }

      // Draw transmission lines
      substations.forEach((node, i) => {
        node.connections.forEach((j) => {
          if (j > i) {
            const other = substations[j]

            // Base line
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(other.x, other.y)
            ctx.strokeStyle = colors.lineBase
            ctx.lineWidth = 1.5
            ctx.stroke()

            // Pulsing effect on active lines
            const pulseIntensity = Math.sin(time * 2 + node.pulsePhase) * 0.5 + 0.5
            const pulseAlpha = Math.floor((0.1 + pulseIntensity * 0.15) * 255).toString(16).padStart(2, '0')
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(other.x, other.y)
            ctx.strokeStyle = `#C8FF32${pulseAlpha}`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        })
      })

      // Update and draw energy packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const packet = packets[i]
        packet.progress += packet.speed

        if (packet.progress >= 1) {
          packets.splice(i, 1)
          continue
        }

        const from = substations[packet.fromNode]
        const to = substations[packet.toNode]
        const x = from.x + (to.x - from.x) * packet.progress
        const y = from.y + (to.y - from.y) * packet.progress

        // Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 12)
        gradient.addColorStop(0, packet.color + '60')
        gradient.addColorStop(1, packet.color + '00')
        ctx.beginPath()
        ctx.arc(x, y, 12, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = packet.color
        ctx.fill()
      }

      // Draw substations
      substations.forEach((node) => {
        const pulse = Math.sin(time * 1.5 + node.pulsePhase) * 0.5 + 0.5
        const baseSize = node.size

        // Get node color
        const nodeColor =
          node.type === 'major' ? colors.nodeMajor :
          node.type === 'solar' ? colors.nodeSolar :
          node.type === 'wind' ? colors.nodeWind :
          colors.nodeMinor

        // Outer glow
        if (node.type === 'major' || node.type === 'solar' || node.type === 'wind') {
          const gradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, baseSize * 4
          )
          gradient.addColorStop(0, nodeColor + '40')
          gradient.addColorStop(1, nodeColor + '00')
          ctx.beginPath()
          ctx.arc(node.x, node.y, baseSize * 4, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
        }

        // Pulsing ring
        ctx.beginPath()
        ctx.arc(node.x, node.y, baseSize + pulse * 4, 0, Math.PI * 2)
        const ringAlpha = (Math.floor(pulse * 40) + 10).toString(16).padStart(2, '0')
        ctx.strokeStyle = nodeColor + ringAlpha
        ctx.lineWidth = 1
        ctx.stroke()

        // Core
        ctx.beginPath()
        ctx.arc(node.x, node.y, baseSize, 0, Math.PI * 2)
        ctx.fillStyle = nodeColor
        ctx.fill()

        // Inner highlight
        ctx.beginPath()
        ctx.arc(node.x - baseSize * 0.3, node.y - baseSize * 0.3, baseSize * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fill()
      })

      // Draw subtle grid lines for reference - Kimi style dots
      const gridSize = 40
      ctx.globalAlpha = 1
      for (let x = 0; x < width; x += gridSize) {
        for (let y = 0; y < height; y += gridSize) {
          // Subtle opacity variation
          const opacity = 0.05 + Math.sin(time + x * 0.01 + y * 0.01) * 0.03
          const dotAlpha = Math.floor(opacity * 255).toString(16).padStart(2, '0')
          ctx.beginPath()
          ctx.arc(x, y, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = `#C8FF32${dotAlpha}`
          ctx.fill()
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [initializeGrid])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  )
}
