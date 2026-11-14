import { parseTransfer, SLOT_PREFIX } from './transfer';
const query = new URLSearchParams(window.location.search);
export const slotId = /^[a-zA-Z0-9-]{1,80}$/.test(query.get('slot') || '') ? query.get('slot') : null;
export let slotData = null;
export let slotError = '';
if (slotId) {
  try { const raw = localStorage.getItem(SLOT_PREFIX + slotId); if (!raw) throw Error('이 브라우저에 해당 월드가 없습니다.'); slotData = parseTransfer(raw); }
  catch (error) { slotError = error.message; }
}
