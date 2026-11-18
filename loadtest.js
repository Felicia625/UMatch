import http from 'k6/http';
import { check, sleep } from 'k6';

const API_KEY = __ENV.API_KEY;        // Firebase web API key (staging)
const PROJECT = __ENV.PROJECT_ID;     // staging project id
const USERS = 50;

export const options = {
  stages: [
    { duration: '20s', target: USERS },  // naik pelan-pelan
    { duration: '40s', target: USERS },  // tahan 50 user
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:discover}': ['p(95)<3000'], // target NFR-01
  },
};

// Jalan sekali: buat 50 akun uji lewat Identity Toolkit REST API
export function setup() {
  const tokens = [];
  for (let i = 0; i < USERS; i++) {
    const r = http.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      JSON.stringify({ email: `loadtest+${Date.now()}_${i}@example.com`, password: 'LoadTest#12345', returnSecureToken: true }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    if (r.status === 200) tokens.push(r.json('idToken'));
  }
  return { tokens };
}

// Tiap virtual user meniru buka tab Discover berulang kali
export default function (data) {
  const token = data.tokens[(__VU - 1) % data.tokens.length];
  const res = http.post(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`,
    JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: { fieldFilter: { field: { fieldPath: 'friendFirst' }, op: 'EQUAL', value: { booleanValue: true } } },
        limit: 10, // kecil supaya hemat kuota
      },
    }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, tags: { name: 'discover' } },
  );
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(3);
}