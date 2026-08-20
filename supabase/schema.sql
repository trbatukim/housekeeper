


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_household_and_join"("household_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$declare
  new_household_id uuid;
begin
  insert into public.households (name) values (household_name)
  returning id into new_household_id;

  insert into public.profiles_to_households (profile_id, household_id)
  values (auth.uid(), new_household_id);

  insert into public.dishes_status (household_id) values (new_household_id);

  return new_household_id;
end;$$;


ALTER FUNCTION "public"."create_household_and_join"("household_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_empty_household"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not exists (
    select 1 from public.profiles_to_households
    where household_id = old.household_id
  ) then
    delete from public.households where id = old.household_id;
  end if;
  return old;
end;
$$;


ALTER FUNCTION "public"."delete_empty_household"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data ->> 'name');
  RETURN new;
END;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_household_member"("_household_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  return exists (
    select 1 from public.profiles_to_households
    where household_id = _household_id
    and profile_id = auth.uid()
  );
end;
$$;


ALTER FUNCTION "public"."is_household_member"("_household_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."dishes_status" (
    "household_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'clean'::"text" NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dishes_status_status_check" CHECK (("status" = ANY (ARRAY['dirty'::"text", 'clean'::"text", 'cleaning'::"text"])))
);


ALTER TABLE "public"."dishes_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dishwasher_loads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "household_id" "uuid" NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ntfy_seq_id" "text",
    CONSTRAINT "dishwasher_loads_status_check" CHECK (("status" = ANY (ARRAY['running'::"text", 'cancelled'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."dishwasher_loads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "household_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "category" "text" NOT NULL,
    "paid_on" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_paid" boolean DEFAULT false NOT NULL,
    "currency" "text",
    CONSTRAINT "expenses_category_check" CHECK (("category" = ANY (ARRAY['recurring'::"text", 'one-time'::"text"])))
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "household_id" "uuid",
    "email" "text",
    "message" "text" NOT NULL,
    "category" "text" NOT NULL,
    "page_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "feedback_category_check" CHECK (("category" = ANY (ARRAY['bug'::"text", 'idea'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grocery_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "household_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "added_by" "uuid",
    "is_purchased" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "amount" numeric(10,2),
    "amount_type" "text"
);


ALTER TABLE "public"."grocery_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."households" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "primary_color" "text" DEFAULT '#a98bff'::"text"
);


ALTER TABLE "public"."households" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."laundry_loads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "household_id" "uuid" NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "color" "text",
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ntfy_seq_id" "text",
    CONSTRAINT "laundry_loads_color_check" CHECK (("color" = ANY (ARRAY['dark'::"text", 'light'::"text"]))),
    CONSTRAINT "laundry_loads_status_check" CHECK (("status" = ANY (ARRAY['running'::"text", 'cancelled'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."laundry_loads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles_to_households" (
    "profile_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "household_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."profiles_to_households" OWNER TO "postgres";


ALTER TABLE ONLY "public"."dishes_status"
    ADD CONSTRAINT "dishes_status_pkey" PRIMARY KEY ("household_id");



ALTER TABLE ONLY "public"."dishwasher_loads"
    ADD CONSTRAINT "dishwasher_loads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grocery_items"
    ADD CONSTRAINT "grocery_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."households"
    ADD CONSTRAINT "households_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."laundry_loads"
    ADD CONSTRAINT "laundry_loads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles_to_households"
    ADD CONSTRAINT "profiles_to_households_pkey" PRIMARY KEY ("profile_id", "household_id");



CREATE OR REPLACE TRIGGER "on_household_member_removed" AFTER DELETE ON "public"."profiles_to_households" FOR EACH ROW EXECUTE FUNCTION "public"."delete_empty_household"();



ALTER TABLE ONLY "public"."dishes_status"
    ADD CONSTRAINT "dishes_status_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dishes_status"
    ADD CONSTRAINT "dishes_status_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dishwasher_loads"
    ADD CONSTRAINT "dishwasher_loads_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."grocery_items"
    ADD CONSTRAINT "grocery_items_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."grocery_items"
    ADD CONSTRAINT "grocery_items_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."laundry_loads"
    ADD CONSTRAINT "laundry_loads_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles_to_households"
    ADD CONSTRAINT "profiles_to_households_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles_to_households"
    ADD CONSTRAINT "profiles_to_households_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Add household dishwasher loads" ON "public"."dishwasher_loads" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_household_member"("household_id"));



CREATE POLICY "Add household expenses" ON "public"."expenses" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_household_member"("household_id"));



CREATE POLICY "Add household groceries" ON "public"."grocery_items" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_household_member"("household_id"));



CREATE POLICY "Add household laundry" ON "public"."laundry_loads" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_household_member"("household_id"));



CREATE POLICY "Anyone can submit feedback" ON "public"."feedback" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("profile_id" IS NULL) OR ("profile_id" = "auth"."uid"())));



CREATE POLICY "Create a household" ON "public"."households" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Delete household dishwasher loads" ON "public"."dishwasher_loads" FOR DELETE TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "Delete household expenses" ON "public"."expenses" FOR DELETE TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "Delete household groceries" ON "public"."grocery_items" FOR DELETE TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "Delete household laundry" ON "public"."laundry_loads" FOR DELETE TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "Join a household" ON "public"."profiles_to_households" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



CREATE POLICY "Leave a household" ON "public"."profiles_to_households" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



CREATE POLICY "Update household dish status" ON "public"."dishes_status" FOR UPDATE TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "Update household dishwasher loads" ON "public"."dishwasher_loads" FOR UPDATE TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "Update household expenses" ON "public"."expenses" FOR UPDATE TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "Update household groceries" ON "public"."grocery_items" FOR UPDATE TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "Update household laundry" ON "public"."laundry_loads" FOR UPDATE TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "Update own households" ON "public"."households" FOR UPDATE TO "authenticated" USING (("id" IN ( SELECT "profiles_to_households"."household_id"
   FROM "public"."profiles_to_households"
  WHERE ("profiles_to_households"."profile_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Update own profile only" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "View household dish status" ON "public"."dishes_status" FOR SELECT TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "View household dishwasher loads" ON "public"."dishwasher_loads" FOR SELECT TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "View household expenses" ON "public"."expenses" FOR SELECT TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "View household groceries" ON "public"."grocery_items" FOR SELECT TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "View household laundry" ON "public"."laundry_loads" FOR SELECT TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "View own and household members' profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR ("id" IN ( SELECT "profiles_to_households"."profile_id"
   FROM "public"."profiles_to_households"
  WHERE ("profiles_to_households"."household_id" IN ( SELECT "profiles_to_households_1"."household_id"
           FROM "public"."profiles_to_households" "profiles_to_households_1"
          WHERE ("profiles_to_households_1"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "View own household memberships" ON "public"."profiles_to_households" FOR SELECT TO "authenticated" USING ("public"."is_household_member"("household_id"));



CREATE POLICY "View own households" ON "public"."households" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "profiles_to_households"."household_id"
   FROM "public"."profiles_to_households"
  WHERE ("profiles_to_households"."profile_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."dishes_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dishwasher_loads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grocery_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."households" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."laundry_loads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles_to_households" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."create_household_and_join"("household_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_household_and_join"("household_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_household_and_join"("household_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_empty_household"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_empty_household"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_empty_household"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_household_member"("_household_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_household_member"("_household_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_household_member"("_household_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."dishes_status" TO "anon";
GRANT ALL ON TABLE "public"."dishes_status" TO "authenticated";
GRANT ALL ON TABLE "public"."dishes_status" TO "service_role";



GRANT ALL ON TABLE "public"."dishwasher_loads" TO "anon";
GRANT ALL ON TABLE "public"."dishwasher_loads" TO "authenticated";
GRANT ALL ON TABLE "public"."dishwasher_loads" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."grocery_items" TO "anon";
GRANT ALL ON TABLE "public"."grocery_items" TO "authenticated";
GRANT ALL ON TABLE "public"."grocery_items" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."households" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."households" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."households" TO "service_role";



GRANT ALL ON TABLE "public"."laundry_loads" TO "anon";
GRANT ALL ON TABLE "public"."laundry_loads" TO "authenticated";
GRANT ALL ON TABLE "public"."laundry_loads" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."profiles_to_households" TO "anon";
GRANT ALL ON TABLE "public"."profiles_to_households" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles_to_households" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































