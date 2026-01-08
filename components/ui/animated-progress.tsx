'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedProgressProps {
    value: number
    max?: number
    label?: string
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
    showPercentage?: boolean
    height?: 'sm' | 'md' | 'lg'
    delay?: number
    animate?: boolean
}

const colors = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    green: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    purple: 'bg-gradient-to-r from-violet-500 to-violet-600',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
    red: 'bg-gradient-to-r from-rose-500 to-rose-600'
}

const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
}

const bgColors = {
    blue: 'bg-blue-100',
    green: 'bg-emerald-100',
    purple: 'bg-violet-100',
    orange: 'bg-orange-100',
    red: 'bg-rose-100'
}

export function AnimatedProgress({
    value,
    max = 100,
    label,
    color = 'blue',
    showPercentage = true,
    height = 'md',
    delay = 0,
    animate = true
}: AnimatedProgressProps) {
    const percentage = Math.min((value / max) * 100, 100)

    return (
        <div className="space-y-2">
            {(label || showPercentage) && (
                <div className="flex items-center justify-between text-sm">
                    {label && <span className="font-medium text-slate-700">{label}</span>}
                    {showPercentage && (
                        <motion.span
                            initial={animate ? { opacity: 0 } : false}
                            animate={{ opacity: 1 }}
                            transition={{ delay: delay + 0.5 }}
                            className="font-semibold text-slate-900"
                        >
                            {percentage.toFixed(1)}%
                        </motion.span>
                    )}
                </div>
            )}
            <div className={cn('relative w-full rounded-full overflow-hidden', bgColors[color], heights[height])}>
                <motion.div
                    initial={animate ? { width: 0 } : false}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                        duration: 1.2,
                        delay,
                        ease: [0.4, 0, 0.2, 1]
                    }}
                    className={cn('h-full rounded-full relative', colors[color])}
                >
                    {/* Shimmer effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                            ease: 'linear'
                        }}
                    />
                </motion.div>
            </div>
        </div>
    )
}

interface EngagementFunnelProps {
    stages: {
        label: string
        value: number
        color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
    }[]
}

export function EngagementFunnel({ stages }: EngagementFunnelProps) {
    const maxValue = Math.max(...stages.map(s => s.value), 1)

    return (
        <div className="space-y-4">
            {stages.map((stage, index) => (
                <motion.div
                    key={stage.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="space-y-1"
                >
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{stage.label}</span>
                        <span className="font-bold text-slate-900">{stage.value.toLocaleString()}</span>
                    </div>
                    <AnimatedProgress
                        value={stage.value}
                        max={maxValue}
                        color={stage.color}
                        showPercentage={false}
                        height="lg"
                        delay={index * 0.15}
                    />
                </motion.div>
            ))}
        </div>
    )
}
