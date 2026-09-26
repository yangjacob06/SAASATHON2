import {test} from 'node:test';
import assert from 'node:assert/strict';
import {iso,asDate,eventDetail} from '../MODEL/workspace/format.js';
test('Auckland follow-up dates keep the intended day across both daylight-saving transitions',()=>{
 for(const [day,utc] of [['2026-09-26','2026-09-25T21:00:00.000Z'],['2026-09-27','2026-09-26T20:00:00.000Z'],['2027-04-03','2027-04-02T20:00:00.000Z'],['2027-04-04','2027-04-03T21:00:00.000Z']]){
  assert.equal(iso(day),utc);assert.equal(asDate(iso(day)),day);
 }
 assert.equal(iso(''),null);
});
test('legacy and current follow-up history show readable dates and clearing actions',()=>{
 assert.match(eventDetail({event_type:'FOLLOW_UP_SET',metadata:{fixture_text:'next_follow_up_at=2026-09-30T09:00:00+12:00'}}),/30 Sept 2026/);
 assert.equal(eventDetail({event_type:'FOLLOW_UP_SET',metadata:{next:null}}),'Follow-up cleared');
 assert.equal(eventDetail({event_type:'NOTE_ADDED',metadata:{fixture_text:'note_id=internal-id'}}),'Saved in broker notes');
});
