echo "--- 1.1 Curriculum Architecture ---"
find artifacts/study-tracker/src -name "ontology*" -exec cat {} + | head -n 20

echo -e "\n--- 1.2 Spaced Repetition (FSRS) ---"
grep -rn -i "fsrs" artifacts/study-tracker/src/ || echo "Not found"

echo -e "\n--- 4.2 Webhook Idempotency & SVIX ---"
cat artifacts/api-server/src/routes/dodo-webhook.ts 2>/dev/null | head -n 30 || echo "Not found"
find artifacts -name "*webhook*.ts"

echo -e "\n--- 4.3 Referral Limit ---"
find artifacts -name "*referral*.ts"

echo -e "\n--- 5.3 Teardown ---"
grep -rn -A 15 "signOut" artifacts/study-tracker/src/

