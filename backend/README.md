## Project setup

```
npm install
npm run dev
```

```
open http://localhost:3000
```

## Database migrations

To create a database migration, make your changes to `schema.prisma` and then run `npx prisma migrate dev`.

To deploy them to Turso, run `turso db shell DB_NAME < SQL_FILE.sql` where DB_NAME is the name of the database on Turso and SQL_FILE.sql is the path to the file that `npx prisma migrate dev` created.
