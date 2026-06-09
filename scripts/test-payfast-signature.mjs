// Round-trips the initiate signer through the ITN verifier without any network.
// Run: node scripts/test-payfast-signature.mjs
import crypto from 'node:crypto'

function pfEncode(value) {
  return encodeURIComponent(String(value))
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/'/g, '%27')
    .replace(/~/g, '%7E')
}

function sign(fields, passphrase) {
  const parts = []
  for (const [k, v] of Object.entries(fields)) {
    if (v === '' || v === undefined || v === null) continue
    parts.push(`${k}=${pfEncode(v)}`)
  }
  let base = parts.join('&')
  if (passphrase) base += `&passphrase=${pfEncode(passphrase)}`
  return crypto.createHash('md5').update(base).digest('hex')
}

function verify(orderedPairs, passphrase, posted) {
  const parts = []
  for (const [k, v] of orderedPairs) {
    if (k === 'signature') continue
    if (v === '' || v === undefined || v === null) continue
    parts.push(`${k}=${pfEncode(v)}`)
  }
  let base = parts.join('&')
  if (passphrase) base += `&passphrase=${pfEncode(passphrase)}`
  const computed = crypto.createHash('md5').update(base).digest('hex')
  return computed.toLowerCase() === String(posted || '').toLowerCase()
}

const passphrase = 'jt7NOE43FZPn' // PayFast docs sandbox passphrase

// ── Test 1: initiate-side signature, round-tripped through ITN-side verify ───
const initiateFields = {
  merchant_id: '10000100',
  merchant_key: '46f0cd694581a',
  return_url: 'https://example.com/payment/success?course=beginner',
  cancel_url: 'https://example.com/payment/cancel?course=beginner',
  notify_url: 'https://example.com/api/payfast/itn',
  name_first: 'Attie',
  email_address: 'test@example.com',
  m_payment_id: '11111111-2222-3333-4444-555555555555',
  amount: '249.00',
  item_name: 'Learning to Work with Claude',
  custom_str1: 'user-uuid-here',
  custom_str2: 'beginner',
}

const initiateSig = sign(initiateFields, passphrase)
const initiateBody = new URLSearchParams({ ...initiateFields, signature: initiateSig }).toString()
const initiatePairs = [...new URLSearchParams(initiateBody).entries()]
const initiateVerify = verify(initiatePairs, passphrase, initiateSig)
console.log(`test 1 (initiate round-trip):           ${initiateVerify ? 'PASS' : 'FAIL'}`)

// ── Test 2: simulated PayFast ITN POST (extra fields PayFast adds) ────────────
const itnFields = {
  ...initiateFields,
  pf_payment_id: '987654',
  payment_status: 'COMPLETE',
  amount_gross: '249.00',
  amount_fee: '-5.74',
  amount_net: '243.26',
}
const itnSig = sign(itnFields, passphrase)
const itnBody = new URLSearchParams({ ...itnFields, signature: itnSig }).toString()
const itnPairs = [...new URLSearchParams(itnBody).entries()]
const itnVerify = verify(itnPairs, passphrase, itnSig)
console.log(`test 2 (ITN round-trip):                ${itnVerify ? 'PASS' : 'FAIL'}`)

// ── Test 3: tampered amount must be rejected ──────────────────────────────────
const tamperedPairs = itnPairs.map(([k, v]) => k === 'amount_gross' ? [k, '1.00'] : [k, v])
const tamperVerify = verify(tamperedPairs, passphrase, itnSig)
console.log(`test 3 (tamper detection):              ${!tamperVerify ? 'PASS (rejected)' : 'FAIL (accepted)'}`)

// ── Test 4: no passphrase configured ──────────────────────────────────────────
const noPassSig = sign(initiateFields, '')
const noPassBody = new URLSearchParams({ ...initiateFields, signature: noPassSig }).toString()
const noPassPairs = [...new URLSearchParams(noPassBody).entries()]
const noPassVerify = verify(noPassPairs, '', noPassSig)
console.log(`test 4 (no passphrase):                 ${noPassVerify ? 'PASS' : 'FAIL'}`)

// ── Test 5: wrong passphrase must be rejected ─────────────────────────────────
const wrongPassVerify = verify(itnPairs, 'wrong-passphrase', itnSig)
console.log(`test 5 (wrong passphrase rejection):    ${!wrongPassVerify ? 'PASS (rejected)' : 'FAIL (accepted)'}`)

// ── Test 6: empty string fields skipped consistently on both sides ────────────
// PayFast sometimes omits optional fields entirely, sometimes sends them empty.
const sparseFields = { ...initiateFields, name_last: '' }
const sparseSig = sign(sparseFields, passphrase)
const sparseBody = new URLSearchParams(
  Object.entries({ ...sparseFields, signature: sparseSig })
).toString()
const sparsePairs = [...new URLSearchParams(sparseBody).entries()]
const sparseVerify = verify(sparsePairs, passphrase, sparseSig)
console.log(`test 6 (empty field handling):          ${sparseVerify ? 'PASS' : 'FAIL'}`)

// ── Test 7: special chars (apostrophe, parens, plus) ──────────────────────────
const specialFields = {
  ...initiateFields,
  name_first: "O'Brien",
  item_name: 'Course (Bundle) +Bonus',
}
const specialSig = sign(specialFields, passphrase)
const specialBody = new URLSearchParams({ ...specialFields, signature: specialSig }).toString()
const specialPairs = [...new URLSearchParams(specialBody).entries()]
const specialVerify = verify(specialPairs, passphrase, specialSig)
console.log(`test 7 (special-character encoding):    ${specialVerify ? 'PASS' : 'FAIL'}`)
