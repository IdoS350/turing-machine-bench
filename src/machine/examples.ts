import { sourceKey, type Source } from '@/machine/model'

export interface Example extends Source {
  name: string
  input: string
}

export const EXAMPLES: readonly Example[] = [
  {
    name: 'Binary increment',
    start: 'right',
    accept: 'done',
    reject: '',
    input: '1011',
    program: `; Adds 1 to a binary number.
; Scan right to the end of the input...
right 0 0 R right
right 1 1 R right
right _ _ L carry

; ...then add one, propagating the carry leftwards.
carry 1 0 L carry
carry 0 1 S done
carry _ 1 S done`,
  },
  {
    name: 'Palindrome (a/b)',
    start: 'q0',
    accept: 'accept',
    reject: 'reject',
    input: 'abba',
    program: `; Accepts palindromes over {a, b}.
; Erase the leftmost symbol and remember it in the state.
q0 a _ R haveA
q0 b _ R haveB
q0 _ _ S accept

; Run to the right end of the remaining input.
haveA _ _ L matchA
haveA * * R haveA
haveB _ _ L matchB
haveB * * R haveB

; The rightmost symbol must match the remembered one.
matchA a _ L back
matchA b b S reject
matchA _ _ S accept
matchB b _ L back
matchB a a S reject
matchB _ _ S accept

; Return to the left end and repeat.
back _ _ R q0
back * * L back`,
  },
  {
    name: 'aⁿbⁿ',
    start: 'q0',
    accept: 'accept',
    reject: '',
    input: 'aabb',
    program: `; Accepts a^n b^n (n >= 0) by crossing off matching pairs.
; Missing rules halt the machine, which counts as a reject.
q0 a X R q1
q0 Y Y R q3
q0 _ _ S accept

; Find the first unmatched b and cross it off.
q1 a a R q1
q1 Y Y R q1
q1 b Y L q2

; Walk back to the last crossed-off a.
q2 a a L q2
q2 Y Y L q2
q2 X X R q0

; Every a is matched: only Ys may remain.
q3 Y Y R q3
q3 _ _ S accept`,
  },
  {
    name: 'Unary addition',
    start: 'q0',
    accept: 'done',
    reject: '',
    input: '111+11',
    program: `; Computes m + n in unary: 111+11 becomes 11111.
; Replace the + with a 1...
q0 1 1 R q0
q0 + 1 R q1

; ...then erase one 1 from the end.
q1 1 1 R q1
q1 _ _ L q2
q2 1 _ S done`,
  },
  {
    name: '3-state busy beaver',
    start: 'A',
    accept: 'H',
    reject: '',
    input: '',
    program: `; Starts on a blank tape, halts after 14 steps with six 1s.
A _ 1 R B
A 1 1 R H
B _ _ R C
B 1 1 R B
C _ 1 L C
C 1 1 L A`,
  },
]

export const isExampleSource = (source: Source) => {
  const key = sourceKey(source)
  return EXAMPLES.some((ex) => sourceKey(ex) === key)
}
