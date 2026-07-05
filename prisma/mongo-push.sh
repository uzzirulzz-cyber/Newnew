#!/bin/bash
export DATABASE_URL="mongodb+srv://max11:n3lSs2xcyaCSGH9O@playbeat.umqpdyx.mongodb.net/playbeat?retryWrites=true&w=majority&appName=playbeat"
npx prisma db push "$@"
