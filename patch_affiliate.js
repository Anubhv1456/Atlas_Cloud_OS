const fs = require('fs');
const p = '/app/applet/artifacts/study-tracker/src/hooks/useAffiliate.ts';
let content = fs.readFileSync(p, 'utf8');

// Replace imports
content = content.replace('onSnapshot,', 'getDoc,');

// Replace the hook logic
const search = `    // Subscribe to admin configuration
    const configRef = doc(firestoreDb, 'config', 'affiliate_config');
    const unsubscribeConfig = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig({                      
        cookieWindowDays: data.cookieWindowDays ?? 60
        });
      }
    });

    const userRef = doc(firestoreDb, 'users', user.uid);
    const unsubscribeUser = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setIsAffiliate(Boolean(data.isAffiliate));
          setAffiliateCode(data.affiliateCode || (data.isAffiliate ? \`affiliate_\${user.uid.slice(0, 6)}\` : null));
        } else {
          setIsAffiliate(false);
          setAffiliateCode(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Could not read affiliate state from Firestore:', err);
        setIsAffiliate(false);
        setAffiliateCode(null);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeConfig();
      unsubscribeUser();
    };`;

const replacement = `    // 1. One-Shot Read: Admin Configuration
    const configRef = doc(firestoreDb, 'config', 'affiliate_config');
    getDoc(configRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig({ cookieWindowDays: data.cookieWindowDays ?? 60 });
      }
    }).catch(() => {}); // Silent catch for offline or transient network errors

    // 2. One-Shot Read: User Affiliate Status
    const userRef = doc(firestoreDb, 'users', user.uid);
    getDoc(userRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsAffiliate(Boolean(data.isAffiliate));
        setAffiliateCode(data.affiliateCode || (data.isAffiliate ? \`affiliate_\${user.uid.slice(0, 6)}\` : null));
      } else {
        setIsAffiliate(false);
        setAffiliateCode(null);
      }
      setLoading(false);
    }).catch((err) => {
      console.warn('Could not read affiliate state from Firestore:', err);
      setIsAffiliate(false);
      setAffiliateCode(null);
      setLoading(false);
    });`;

content = content.replace(search, replacement);
fs.writeFileSync(p, content, 'utf8');
console.log('patched useAffiliate');
