type ClassValue = string | false | null | undefined

export const cx = (...classes: ClassValue[]) => classes.filter(Boolean).join(' ')
