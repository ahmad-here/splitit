# Firestore data model (Splitit)

NoSQL collections used by the app (client, RLS-guarded) and the Nest server
(Admin SDK, bypasses rules). IDs in `{braces}` are document ids.

## profiles/{uid}
One per Firebase Auth user (uid). Created by the server on first sign-in.
```
firstName, lastName, email            : string
friendCode                            : string   // unique 6-char, e.g. "K7QMР2"
createdAt                             : timestamp
```
Reverse lookup by code uses a query: `profiles where friendCode == <code>`.

## friendships/{uid}/friends/{friendUid}
Symmetric — redeeming a code writes both directions (Admin).
```
status     : "active"
createdAt  : timestamp
```

## splits/{splitId}
Mirrors the app's SplitRecord.
```
ownerId          : uid
title, description, currency, paidBy   : string
subtotal, tax, tip, total              : number
needsReview                            : boolean
items, assignments                     : array (see core schema)
participants     : [{ profileId?: uid|null, name: string, amount: number }]
participantIds   : [uid]     // linked participants only, for the read rule
createdAt        : timestamp
```

## payments/{paymentId}
```
ownerId, friendId?, friendName, note   : string
amount                                 : number
direction                              : "received" | "given"
createdAt                              : timestamp
```

## notifications/{notifId}
Created server-side only.
```
recipientId, actorId?, type, title, body   : string   // type: "split_added"|"reminder"
data        : map
read        : boolean
createdAt   : timestamp
```

## pushTokens/{uid}
```
tokens : [string]   // Expo push tokens for this user's devices
```

## chats/{chatId}  +  chats/{chatId}/messages/{messageId}
```
chats:     userId, title, createdAt, updatedAt
messages:  role ("user"|"assistant"), text, imageUrl?, createdAt
```

## userMemory/{uid}
Durable cross-chat facts (ChatGPT-style memory), written by the server.
```
facts     : [string]
updatedAt : timestamp
```
