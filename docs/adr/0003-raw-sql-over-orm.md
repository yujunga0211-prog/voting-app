# ORM 없이 Neon에 SQL 직접 작성

테이블이 `polls`, `options`, `votes` 세 개뿐이라 ORM(Drizzle, Prisma)을 도입하는 비용이 이점보다 크다고 판단해, `@neondatabase/serverless`로 SQL을 직접 작성하고 스키마는 `.sql` 마이그레이션 파일로 관리한다. ORM이 없는 것은 의도된 선택이다.
