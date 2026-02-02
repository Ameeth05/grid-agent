'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useTheme } from '@/hooks/useTheme'

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

export function GridAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isDark, mounted } = useTheme()
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
    if (!mounted) return

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

    // Colors
    const getColors = () => {
      if (isDark) {
        return {
          lineBase: 'rgba(16, 185, 129, 0.08)',
          lineActive: 'rgba(16, 185, 129, 0.25)',
          nodeMajor: '#10B981',
          nodeMinor: '#34D399',
          nodeSolar: '#F59E0B',
          nodeWind: '#22D3EE',
          glow: 'rgba(16, 185, 129, 0.3)',
          packet: '#10B981',
        }
      }
      return {
        lineBase: 'rgba(16, 185, 129, 0.06)',
        lineActive: 'rgba(16, 185, 129, 0.2)',
        nodeMajor: '#059669',
        nodeMinor: '#10B981',
        nodeSolar: '#D97706',
        nodeWind: '#0891B2',
        glow: 'rgba(16, 185, 129, 0.2)',
        packet: '#059669',
      }
    }

    const animate = () => {
      time += 0.016 // ~60fps
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      const colors = getColors()

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
            const dx = other.x - node.x
            const dy = other.y - node.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            // Base line
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(other.x, other.y)
            ctx.strokeStyle = colors.lineBase
            ctx.lineWidth = 1.5
            ctx.stroke()

            // Pulsing effect on active lines
            const pulseIntensity = Math.sin(time * 2 + node.pulsePhase) * 0.5 + 0.5
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(other.x, other.y)
            ctx.strokeStyle = colors.lineActive.replace('0.25', (0.1 + pulseIntensity * 0.15).toFixed(2))
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
        ctx.strokeStyle = nodeColor + (Math.floor(pulse * 40) + 10).toString(16)
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

      // Draw subtle grid lines for reference
      ctx.globalAlpha = 0.03
      const gridSize = 80
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.strokeStyle = isDark ? '#fff' : '#000'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.strokeStyle = isDark ? '#fff' : '#000'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isDark, mounted, initializeGrid])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  )
}
