# Référence Rapide - Exigences Techniques

**Document de référence rapide** pour éviter les erreurs courantes

---

## ⚡ Checklist Rapide

### Avant de créer/modifier du code

```
□ Next.js 15 : searchParams est une Promise ?
□ Next.js 15 : Cookies modifiés uniquement dans Server Actions/Route Handlers ?
□ Next.js 15 : useSearchParams() enveloppé dans Suspense ?
□ TypeScript : Toutes les Promises awaitées ?
□ Supabase : createSupabaseServerClient() awaité ?
□ Architecture : Routes API utilisent les services ?
□ Validation : Zod utilisé pour les routes API ?
□ React : Pas de setState direct dans useEffect ?
```

---

## 🚨 Erreurs Courantes

### 1. Oublier `await` sur `createSupabaseServerClient()`
```typescript
// ❌ const supabase = createSupabaseServerClient();
// ✅ const supabase = await createSupabaseServerClient();
```

### 2. Modifier les cookies dans un Server Component
```typescript
// ❌ cookieStore.set() dans Server Component
// ✅ No-op dans Server Component, OK dans Server Action
```

### 3. `searchParams` sans await
```typescript
// ❌ const type = searchParams?.type;
// ✅ const params = await searchParams; const type = params?.type;
```

### 4. Duplication routes API / services
```typescript
// ❌ Logique dupliquée dans route API
// ✅ Route API utilise le service
```

### 5. Pas de validation Zod
```typescript
// ❌ Validation manuelle
// ✅ const validated = schema.parse(body);
```

---

## 📚 Documents Complets

- [`CORRECTIONS-BUILD-2025-01-19.md`](./CORRECTIONS-BUILD-2025-01-19.md)
- [`EXIGENCES-TECHNIQUES-PROJET.md`](./EXIGENCES-TECHNIQUES-PROJET.md)

