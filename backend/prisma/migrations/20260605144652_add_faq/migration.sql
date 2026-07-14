-- CreateTable
CREATE TABLE "faq" (
    "id_faq" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question" VARCHAR(255) NOT NULL,
    "reponse" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "faq_pkey" PRIMARY KEY ("id_faq")
);
