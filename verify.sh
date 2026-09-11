echo "--- 1.1 Curriculum Architecture ---"
head -n 20 artifacts/study-tracker/src/data/ontology.ts || echo "Not found"

echo -e "\n--- 1.2 Spaced Repetition (FSRS) ---"
grep -rn "fsrs" artifacts/study-tracker/src/ || echo "Not found"

echo -e "\n--- 1.3 Clinical Mistake Autopsy ---"
grep -rn "taxonomy" artifacts/study-tracker/src/features/mistakes/ || echo "Not found"

echo -e "\n--- 2.1 Persist ---"
grep -A 5 "navigator.storage.persist" artifacts/study-tracker/src/db/localDb.ts

echo -e "\n--- 2.3 BroadcastChannel ---"
grep -A 5 "BroadcastChannel" artifacts/study-tracker/src/db/localDb.ts

echo -e "\n--- 3.1 AI Proxy & Regex ---"
grep -A 10 "fetch" artifacts/study-tracker/src/lib/ai/geminiClient.ts || echo "Not found"
grep -rn "AIza" artifacts/study-tracker/src/

echo -e "\n--- 3.2 Socratic ---"
grep -rn -i "socratic" artifacts/study-tracker/src/lib/ai/

echo -e "\n--- 4.2 Webhook Idempotency & SVIX ---"
cat artifacts/study-tracker/api/dodo-webhook.ts 2>/dev/null | head -n 30 || echo "Not found"

echo -e "\n--- 4.3 Referral Limit ---"
cat artifacts/study-tracker/api/claim-referral.ts 2>/dev/null | head -n 20 || echo "Not found"
grep -rn "via=" artifacts/study-tracker/src/

echo -e "\n--- 5.1 Night Mode Colors ---"
grep -A 10 ".dark" artifacts/study-tracker/src/index.css

echo -e "\n--- 5.2 100dvh ---"
grep -rn "dvh" artifacts/study-tracker/src/

echo -e "\n--- 5.3 Teardown ---"
grep -A 15 "signOut" artifacts/study-tracker/src/hooks/useAuth.ts

echo -e "\n--- 6.1 vercel.json ---"
cat artifacts/study-tracker/vercel.json | grep -A 15 "headers"
