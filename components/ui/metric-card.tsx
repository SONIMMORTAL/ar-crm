'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon?: ReactNode
    trend?: {
        value: number
        isPositive: boolean
    }
    gradient?: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'indigo'
    delay?: number
}

const gradientConfig = {
    blue: {
        bg: 'from-blue-50/80 to-white',
        border: 'border-blue-100/60',
        icon: 'from-blue-500 to-blue-600',
        iconShadow: 'rgba(59, 130, 246, 0.25)',
        value: 'text-blue-600'
    },
    green: {
        bg: 'from-emerald-50/80 to-white',
        border: 'border-emerald-100/60',
        icon: 'from-emerald-500 to-green-600',
        iconShadow: 'rgba(16, 185, 129, 0.25)',
        value: 'text-emerald-600'
    },
    purple: {
        bg: 'from-violet-50/80 to-white',
        border: 'border-violet-100/60',
        icon: 'from-violet-500 to-purple-600',
        iconShadow: 'rgba(139, 92, 246, 0.25)',
        value: 'text-violet-600'
    },
    red: {
        bg: 'from-rose-50/80 to-white',
        border: 'border-rose-100/60',
        icon: 'from-rose-500 to-red-600',
        iconShadow: 'rgba(244, 63, 94, 0.25)',
        value: 'text-rose-600'
    },
    orange: {
        bg: 'from-orange-50/80 to-white',
        border: 'border-orange-100/60',
        icon: 'from-orange-500 to-amber-600',
        iconShadow: 'rgba(249, 115, 22, 0.25)',
        value: 'text-orange-600'
    },
    indigo: {
        bg: 'from-indigo-50/80 to-white',
        border: 'border-indigo-100/60',
        icon: 'from-indigo-500 to-violet-600',
        iconShadow: 'rgba(99, 102, 241, 0.25)',
        value: 'text-indigo-600'
    }
}

export function MetricCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    gradient = 'blue',
    delay = 0
}: MetricCardProps) {
    const config = gradientConfig[gradient]

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                delay,
                ease: [0.16, 1, 0.3, 1]
            }}
            whileHover={{
                y: -2,
                transition: { duration: 0.2 }
            }}
            className={cn(
                'relative overflow-hidden rounded-xl border bg-gradient-to-br',
                'shadow-premium hover:shadow-premium-lg',
                'transition-all duration-300',
                config.bg,
                config.border
            )}
        >
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    {/* Icon */}
                    {icon && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: delay + 0.1, duration: 0.3 }}
                            className={cn(
                                'p-2.5 rounded-xl bg-gradient-to-br text-white',
                                config.icon
                            )}
                            style={{ boxShadow: `0 4px 12px ${config.iconShadow}` }}
                        >
                            {icon}
                        </motion.div>
                    )}

                    {/* Trend badge */}
                    {trend && (
                        <motion.div
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: delay + 0.2 }}
                            className={cn(
                                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-tight',
                                trend.isPositive
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                            )}
                        >
                            <span className="text-[10px]">{trend.isPositive ? '↑' : '↓'}</span>
                            <span>{Math.abs(trend.value)}%</span>
                        </motion.div>
                    )}
                </div>

                <div className="mt-4 space-y-1">
                    <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: delay + 0.15, duration: 0.3 }}
                        className={cn(
                            'text-[28px] font-bold tracking-[-0.02em] leading-none',
                            config.value
                        )}
                    >
                        {value}
                    </motion.p>
                    <p className="text-[13px] font-medium text-slate-600 tracking-[-0.01em]">{title}</p>
                    {subtitle && (
                        <p className="text-[11px] text-slate-400 tracking-tight">{subtitle}</p>
                    )}
                </div>
            </div>

            {/* Subtle decoration */}
            <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-[0.03] bg-current" />
        </motion.div>
    )
}
