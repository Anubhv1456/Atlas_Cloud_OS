const fs = require('fs');
const p = 'artifacts/study-tracker/src/hooks/useAffiliate.ts';
let c = fs.readFileSync(p, 'utf8');

const s1 = `    // Subscribe to admin configuration
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

const r1 = `    // Subscribe to admin configuration
    const configRef = doc(firestoreDb, 'config', 'affiliate_config');
    getDoc(configRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig({ cookieWindowDays: data.cookieWindowDays ?? 60 });
      }
    }).catch(() => {});

    const userRef = doc(firestoreDb, 'users', user.uid);
    getDoc(userRef).then(
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
      }).catch(
      (err) => {
        console.warn('Could not read affiliate state from Firestore:', err);
        setIsAffiliate(false);
        setAffiliateCode(null);
        setLoading(false);
      }
    );

    return () => {
    };`;

if (c.indexOf("onSnapshot(configRef") !== -1) {
  let startIndex = c.indexOf("    // Subscribe to admin configuration");
  let endIndex = c.indexOf("  }, [user, isImpersonating, impersonatedUser]);");
  let newBody = c.substring(0, startIndex) + r1 + "\n" + c.substring(endIndex);
  fs.writeFileSync(p, newBody);
  console.log("Fixed useAffiliate");
}
