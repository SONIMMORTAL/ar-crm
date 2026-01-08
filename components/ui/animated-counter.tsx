'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface AnimatedCounterProps {
    value: number
    duration?: number
    delay?: number
    prefix?: string
    suffix?: string
    decimals?: number
    className?: string
}

export function AnimatedCounter({
    value,
    duration = 1.5,
    delay = 0,
    prefix = '',
    suffix = '',
    decimals = 0,
    className = ''
}: AnimatedCounterProps) {
    const [isInView, setIsInView] = useState(false)
    const ref = useRef<HTMLSpanElement>(null)

    const spring = useSpring(0, {
        stiffness: 50,
        damping: 30,
        duration: duration * 1000
    })

    const display = useTransform(spring, (current) => {
        if (decimals > 0) {
            return current.toFixed(decimals)
        }
        return Math.round(current).toLocaleString()
    })

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true)
                }
            },
            { threshold: 0.1 }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (isInView) {
            const timeout = setTimeout(() => {
                spring.set(value)
            }, delay * 1000)
            return () => clearTimeout(timeout)
        }
    }, [isInView, value, spring, delay])

    return (
        <span ref={ref} className={className}>
            {prefix}
            <motion.span>{display}</motion.span>
            {suffix}
        </span>
    )
}

interface AnimatedPercentageProps {
    value: number
    delay?: number
    className?: string
}

export function AnimatedPercentage({
    value,
    delay = 0,
    className = ''
}: AnimatedPercentageProps) {
    return (
        <AnimatedCounter
            value={value}
            delay={delay}
            suffix="%"
            decimals={1}
            className={className}
        />
    )
}

interface CountUpStatsProps {
    stats: {
        label: string
        value: number
        prefix?: string
        suffix?: string
    }[]
}

export function CountUpStats({ stats }: CountUpStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center"
                >
                    <AnimatedCounter
                        value={stat.value}
                        delay={0.2 + index * 0.1}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                        className="text-3xl font-bold text-slate-900"
                    />
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
            ))}
        </div>
    )
}
