--
-- PostgreSQL database dump
--

\restrict xRG9ga2gkLAYvV97zFKno3Vn7pBVbqATeogcDGHastwegy0Tcf2eqvHdzTiHhrE

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: postgres
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: postgres
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: postgres
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    student_id integer NOT NULL,
    structure_id integer NOT NULL,
    collection_id integer NOT NULL,
    year smallint NOT NULL,
    month smallint NOT NULL
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: capacities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.capacities (
    structure_id integer NOT NULL,
    year smallint NOT NULL,
    capacity integer NOT NULL
);


ALTER TABLE public.capacities OWNER TO postgres;

--
-- Name: preference_collection_intervals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preference_collection_intervals (
    id integer NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    number_of_preferences smallint NOT NULL,
    year smallint NOT NULL
);


ALTER TABLE public.preference_collection_intervals OWNER TO postgres;

--
-- Name: preference_collection_intervals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preference_collection_intervals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preference_collection_intervals_id_seq OWNER TO postgres;

--
-- Name: preference_collection_intervals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preference_collection_intervals_id_seq OWNED BY public.preference_collection_intervals.id;


--
-- Name: preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preferences (
    student_id integer NOT NULL,
    collection_id integer NOT NULL,
    site_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    month smallint NOT NULL,
    weight smallint NOT NULL
);


ALTER TABLE public.preferences OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer CONSTRAINT "sessions_userId_not_null" NOT NULL,
    expires_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '02:00:00'::interval) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    key character varying NOT NULL,
    value text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: sites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sites (
    id integer NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.sites OWNER TO postgres;

--
-- Name: sites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sites_id_seq OWNER TO postgres;

--
-- Name: sites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sites_id_seq OWNED BY public.sites.id;


--
-- Name: structures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.structures (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    ward character varying(255),
    area character varying(255),
    kind character varying(255),
    site_id integer,
    year_of_course smallint
);


ALTER TABLE public.structures OWNER TO postgres;

--
-- Name: structures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.structures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.structures_id_seq OWNER TO postgres;

--
-- Name: structures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.structures_id_seq OWNED BY public.structures.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    number integer,
    email character varying NOT NULL,
    encoded_password character varying(380),
    name character varying(255),
    surname character varying(255),
    enrollment_year smallint,
    outstanding_otp integer,
    outstanding_otp_expires_at timestamp without time zone,
    new_email character varying,
    mfa_secret uuid,
    accepted boolean DEFAULT false,
    registered_at timestamp without time zone DEFAULT now() NOT NULL,
    role text DEFAULT 'student'::text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: preference_collection_intervals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preference_collection_intervals ALTER COLUMN id SET DEFAULT nextval('public.preference_collection_intervals_id_seq'::regclass);


--
-- Name: sites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites ALTER COLUMN id SET DEFAULT nextval('public.sites_id_seq'::regclass);


--
-- Name: structures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structures ALTER COLUMN id SET DEFAULT nextval('public.structures_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	6860fe6f7924cfdd537b103f989e355b190dd94587db50ef8fe9867258b524fd	1780926438182
7	1d3f2d511fef0c96bd76b79d72132005890300eb3b53c6d55587d32ebf9fb56f	1781248638020
8	a00cd716030706358a2745b7c99b551bd7c155e74726e1c82f71598accef96f7	1781277504755
9	a280d6070f6654e53d19b597c95fdd6fae879d95b463a7e60b42c1781eebfad2	1781875632931
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (student_id, structure_id, collection_id, year, month) FROM stdin;
531	178	32	2026	0
531	178	32	2026	1
531	178	32	2026	2
532	178	32	2026	0
532	178	32	2026	1
532	178	32	2026	2
532	91	32	2026	4
539	146	32	2026	0
539	148	32	2026	1
539	148	32	2026	2
540	178	32	2026	0
540	178	32	2026	1
540	178	32	2026	2
540	93	32	2026	3
541	178	32	2026	0
541	178	32	2026	1
541	178	32	2026	2
542	178	32	2026	0
542	178	32	2026	1
542	178	32	2026	2
544	178	32	2026	0
544	178	32	2026	1
544	178	32	2026	2
545	178	32	2026	0
545	178	32	2026	1
545	178	32	2026	2
546	178	32	2026	0
546	178	32	2026	1
546	178	32	2026	2
547	178	32	2026	0
547	178	32	2026	1
547	178	32	2026	2
548	178	32	2026	0
548	178	32	2026	1
548	178	32	2026	2
549	178	32	2026	0
549	178	32	2026	1
549	178	32	2026	2
550	178	32	2026	0
550	178	32	2026	1
550	178	32	2026	2
553	177	32	2026	0
553	177	32	2026	1
553	177	32	2026	2
554	178	32	2026	0
554	177	32	2026	1
554	178	32	2026	2
555	178	32	2026	0
555	177	32	2026	1
555	168	32	2026	2
556	177	32	2026	0
556	178	32	2026	1
556	177	32	2026	2
580	158	32	2026	0
580	160	32	2026	1
580	163	32	2026	2
552	178	32	2026	0
552	177	32	2026	1
552	177	32	2026	2
995	155	32	2026	0
995	142	32	2026	1
995	145	32	2026	2
\.


--
-- Data for Name: capacities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.capacities (structure_id, year, capacity) FROM stdin;
134	2026	2
135	2026	2
136	2026	5
137	2026	2
138	2026	2
139	2026	5
140	2026	5
141	2026	4
142	2026	5
143	2026	5
144	2026	5
145	2026	5
146	2026	5
147	2026	5
148	2026	5
149	2026	2
150	2026	2
151	2026	5
152	2026	5
153	2026	5
154	2026	2
155	2026	2
156	2026	2
157	2026	2
158	2026	5
159	2026	5
160	2026	2
161	2026	5
162	2026	5
163	2026	5
164	2026	2
165	2026	5
166	2026	2
167	2026	5
168	2026	5
169	2026	2
170	2026	2
172	2026	5
175	2026	5
176	2026	2
91	2026	2
92	2026	15
93	2026	10
94	2026	10
95	2026	2
96	2026	10
97	2026	5
98	2026	6
99	2026	10
100	2026	3
101	2026	15
102	2026	2
103	2026	10
104	2026	10
105	2026	10
106	2026	6
107	2026	10
108	2026	12
109	2026	10
110	2026	4
111	2026	8
112	2026	8
113	2026	10
114	2026	4
115	2026	5
116	2026	10
117	2026	15
118	2026	20
119	2026	5
120	2026	5
121	2026	10
122	2026	6
123	2026	10
124	2026	5
125	2026	10
126	2026	5
127	2026	10
128	2026	10
129	2026	5
130	2026	12
131	2026	10
132	2026	10
133	2026	1
91	2025	2
92	2025	15
93	2025	10
94	2025	10
95	2025	2
96	2025	10
97	2025	5
98	2025	6
99	2025	10
100	2025	3
101	2025	15
102	2025	2
103	2025	10
104	2025	10
105	2025	10
106	2025	6
107	2025	10
108	2025	12
109	2025	10
110	2025	4
111	2025	8
112	2025	8
113	2025	10
114	2025	4
115	2025	5
116	2025	10
117	2025	15
118	2025	20
119	2025	5
120	2025	5
121	2025	10
122	2025	6
123	2025	10
124	2025	5
125	2025	10
126	2025	5
127	2025	10
128	2025	10
129	2025	5
130	2025	12
131	2025	10
132	2025	10
133	2025	1
177	2026	2
178	2026	3
174	2026	1
179	2026	15
171	2026	5
173	2026	6
180	2026	14
\.


--
-- Data for Name: preference_collection_intervals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preference_collection_intervals (id, start_time, end_time, number_of_preferences, year) FROM stdin;
15	2026-05-10 08:45:00	2026-05-11 08:46:00	4	2026
21	2026-05-29 10:28:00	2026-05-29 10:29:00	3	2026
24	2026-05-29 11:02:00	2026-05-29 11:03:00	3	2026
32	2026-06-01 06:00:00	2026-06-10 08:20:00	4	2026
\.


--
-- Data for Name: preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preferences (student_id, collection_id, site_id, created_at, month, weight) FROM stdin;
580	32	67	2026-06-04 18:59:24.204966	0	0
580	32	67	2026-06-04 18:59:24.204966	1	0
580	32	67	2026-06-04 18:59:24.204966	2	1
580	32	77	2026-06-04 18:59:24.204966	2	0
531	32	87	2026-06-04 17:49:55.10299	0	0
531	32	87	2026-06-04 17:49:55.10299	1	0
531	32	87	2026-06-04 17:49:55.10299	2	0
532	32	87	2026-06-04 17:50:01.9819	0	0
532	32	87	2026-06-04 17:50:01.9819	1	0
532	32	87	2026-06-04 17:50:01.9819	2	0
540	32	87	2026-06-04 17:50:14.224606	0	0
540	32	87	2026-06-04 17:50:14.224606	1	0
540	32	87	2026-06-04 17:50:14.224606	2	0
541	32	87	2026-06-04 17:51:55.850092	0	0
541	32	87	2026-06-04 17:51:55.850092	1	0
541	32	87	2026-06-04 17:51:55.850092	2	0
542	32	87	2026-06-04 17:52:12.319899	0	0
542	32	87	2026-06-04 17:52:12.319899	1	0
542	32	87	2026-06-04 17:52:12.319899	2	0
544	32	87	2026-06-04 17:52:24.475087	0	0
539	32	55	2026-06-04 16:10:38.489354	0	0
539	32	55	2026-06-04 16:10:38.489354	1	0
539	32	55	2026-06-04 16:10:38.489354	2	0
544	32	87	2026-06-04 17:52:24.475087	1	0
544	32	87	2026-06-04 17:52:24.475087	2	0
546	32	87	2026-06-04 18:24:23.69009	0	0
546	32	87	2026-06-04 18:24:23.69009	1	0
546	32	87	2026-06-04 18:24:23.69009	2	0
547	32	87	2026-06-04 18:24:29.92003	0	0
547	32	87	2026-06-04 18:24:29.92003	1	0
547	32	87	2026-06-04 18:24:29.92003	2	0
548	32	87	2026-06-04 18:24:35.818138	0	0
548	32	87	2026-06-04 18:24:35.818138	1	0
548	32	87	2026-06-04 18:24:35.818138	2	0
549	32	87	2026-06-04 18:24:43.814163	0	0
549	32	87	2026-06-04 18:24:43.814163	1	0
549	32	87	2026-06-04 18:24:43.814163	2	0
550	32	87	2026-06-04 18:24:52.818167	0	0
550	32	87	2026-06-04 18:24:52.818167	1	0
550	32	87	2026-06-04 18:24:52.818167	2	0
552	32	87	2026-06-04 18:25:05.028046	0	0
552	32	87	2026-06-04 18:25:05.028046	1	0
552	32	87	2026-06-04 18:25:05.028046	2	0
553	32	87	2026-06-04 18:25:14.374418	0	0
553	32	87	2026-06-04 18:25:14.374418	1	0
553	32	87	2026-06-04 18:25:14.374418	2	0
556	32	87	2026-06-04 18:25:30.906187	0	0
556	32	87	2026-06-04 18:25:30.906187	1	0
556	32	87	2026-06-04 18:25:30.906187	2	0
554	32	87	2026-06-04 18:43:15.978796	0	0
554	32	87	2026-06-04 18:43:15.978796	1	0
554	32	87	2026-06-04 18:43:15.978796	2	1
554	32	65	2026-06-04 18:43:15.978796	2	0
555	32	87	2026-07-06 18:32:49.515999	0	0
555	32	87	2026-07-06 18:32:49.515999	1	1
555	32	48	2026-07-06 18:32:49.515999	1	0
555	32	87	2026-07-06 18:32:49.515999	2	1
555	32	77	2026-07-06 18:32:49.515999	2	0
545	32	87	2026-07-09 16:12:45.061157	0	0
545	32	87	2026-07-09 16:12:45.061157	1	0
545	32	87	2026-07-09 16:12:45.061157	2	1
545	32	65	2026-07-09 16:12:45.061157	2	0
995	32	44	2026-06-10 10:02:03.913267	0	3
995	32	65	2026-06-10 10:02:03.913267	0	2
995	32	66	2026-06-10 10:02:03.913267	0	1
995	32	74	2026-06-10 10:02:03.913267	0	0
995	32	47	2026-06-10 10:02:03.913267	1	2
995	32	49	2026-06-10 10:02:03.913267	1	1
995	32	44	2026-06-10 10:02:03.913267	1	0
995	32	48	2026-06-10 10:02:03.913267	2	2
995	32	55	2026-06-10 10:02:03.913267	2	1
995	32	44	2026-06-10 10:02:03.913267	2	0
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, expires_at, created_at) FROM stdin;
80e055a8-256b-4bdb-8fa8-108085dc3fc3	995	2026-06-03 15:34:04.07	2026-06-03 15:34:04.073134
722e5f27-6122-41f9-8bb7-5d3e16e2e77a	995	2026-06-04 13:30:50.772	2026-06-04 13:30:50.777518
44bf5b3c-1c82-4b69-9740-9019de337270	995	2026-06-04 16:01:43.884	2026-06-04 16:01:43.885687
0763cbe8-3fae-482e-963d-5a0acdf45f26	1	2026-07-05 08:57:59.109	2026-06-05 10:57:59.111019
0aaa5d06-40ec-4dc5-80e0-be19da285ee1	995	2026-06-10 10:03:18.739	2026-06-10 10:03:18.740277
dc41a675-775b-4375-a161-96ed0202408f	995	2026-06-11 08:44:44.752	2026-06-11 08:44:44.754686
2135612e-1cd1-443e-9f53-dc07aa77dcdc	995	2026-06-11 15:18:17.574	2026-06-11 15:18:17.575662
72b612ce-02ed-4fcf-a496-8968f8be3a3a	995	2026-06-12 09:19:25.505	2026-06-12 09:19:25.50621
43424f13-d311-4d14-8519-996da6496e28	995	2026-06-15 18:16:55.845	2026-06-15 18:16:55.84632
f10d8dba-9826-4194-9d44-7d482eb71db0	1	2026-07-27 07:06:14.227	2026-06-27 09:06:14.229018
91a428ba-ef3a-4813-beae-26300a24537a	1	2026-07-27 07:06:27.093	2026-06-27 09:06:27.093834
011b3da1-a14b-4030-b63e-8f77ff1f7831	1	2026-07-27 07:11:44.427	2026-06-27 09:11:44.427565
568c3940-6206-44d3-b11b-c236720cb458	1	2026-07-27 07:22:30.845	2026-06-27 09:22:30.846052
1400e31c-d2f8-46cd-ad00-7ebeccb8498e	1	2026-07-27 07:22:52.641	2026-06-27 09:22:52.64253
3d68ad5a-c351-432b-978c-c38ed8884a37	1	2026-07-27 07:23:08.932	2026-06-27 09:23:08.932541
da4fed90-b4a4-44e0-b32e-423037a3747b	1	2026-07-27 07:23:45.221	2026-06-27 09:23:45.221712
66232052-9b10-4c91-953a-fe629b72b112	1	2026-07-27 07:37:23.995	2026-06-27 09:37:23.995777
4fcbf93c-4439-4380-802a-6b3a00af5d61	1	2026-07-29 08:50:30.084	2026-06-29 10:50:30.089588
5e4bf920-5ba7-4801-bd98-bbf820a0b8fd	995	2026-06-29 11:03:48.541	2026-06-29 11:03:48.542618
6d2754a4-4dbb-4737-bb75-bc50290db970	995	2026-07-01 18:38:43.214	2026-07-01 18:38:43.215427
dd909cbc-7c28-45db-bd04-ccf818a1f2f9	1	2026-08-01 10:34:26.899	2026-07-02 12:34:26.899875
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (key, value, updated_at) FROM stdin;
appName	Tirocinio	2026-06-03 09:41:57.542
smtpPassword	1a3892644ad8638533a3d1cc33e72ff2:16d73c47c1d497d535d42ffff608648b65804d0c8edd22d98a89429276aecbeb	2026-06-02 14:26:40.297
submitterEmail	goffredo2004@gmail.com	2026-06-02 14:56:29.771
smtpHost	smtp.gmail.com	2026-06-02 14:56:29.773
smtpPort	587	2026-06-02 14:56:29.775
smtpUsername	goffredo2004@gmail.com	2026-06-02 14:56:29.776
autoAcceptEmailSuffix		2026-06-10 07:49:15.881
autoAcceptAllStudents	false	2026-06-10 07:49:15.891
firstYear	3	2026-06-11 15:19:20.607
secondYear	4	2026-06-11 15:19:20.617
thirdYear	5	2026-06-11 15:19:20.619
yearCapacities	\N	2026-07-09 14:50:30.771
\.


--
-- Data for Name: sites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sites (id, name) FROM stdin;
44	Acri
47	Amantea
48	Cassano
49	Castrovillari
55	Cetraro
59	Corigliano
64	Cosenza
66	Lungro
67	Paola
74	Praia a mare
65	Scalea
87	Trebisacce
77	Rossano
83	San Giovanni in fiore
1	Cosenza/Rende
\.


--
-- Data for Name: structures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.structures (id, name, ward, area, kind, site_id, year_of_course) FROM stdin;
134	ASP-Acri-Day Surgery	Day Surgery	Chirurgia	ASP	44	\N
135	ASP-Acri-Distretto	Distretto	Servizio	ASP	44	\N
136	ASP-Acri-Medicina	Medicina	Medicina	ASP	44	\N
137	ASP-Amantea-Poliambulatorio	Poliambulatorio	Servizio	ASP	47	\N
138	ASP-Cassano	Distretto	Servizio	ASP	48	\N
139	ASP-Castrovillari-Cardiologia/utic	Cardiologia/UTIC	Medicina Specialistica	ASP	49	\N
140	ASP-Castrovillari-Chirurgia/oculistica	Chirurgia oculistica	Chirurgia Specialistica	ASP	49	\N
141	ASP-Castrovillari-Distretto	Distretto	Servizio	ASP	49	\N
142	ASP-Castrovillari-Medicina	Medicina	Medicina	ASP	49	\N
143	ASP-Castrovillari-Neurologia	Neurologia	Medicina Specialistica	ASP	49	\N
144	ASP-Castrovillari-Pneumologia	Pneumologia	Medicina Specialistica	ASP	49	\N
145	ASP-Cetraro-Chirurgia/Urologia	Chirurgia Urologia	Chirurgia Specialistica	ASP	55	\N
146	ASP-Cetraro-Ginecologia/Ostricia	Ginecologia/Ostricia	Materno Infantile	ASP	55	\N
147	ASP-Cetraro-Medicina/cardiologia	Medicina/cardiologia	Medicina	ASP	55	\N
148	ASP-Cetraro-Poliambulatorio	Poliambulatorio	Servizio	ASP	55	\N
149	ASP-Corigliano-Sala operatoria	Sala operatoria	Area Critica	ASP	59	\N
150	ASP-Corigliano-Distretto	Distretto	Servizio	ASP	59	\N
151	ASP-Corigliano-Medicina Generale	Medicina Generale	Medicina	ASP	59	\N
152	ASP-Corigliano-Neurologia	Neurologia	Medicina Specialistica	ASP	59	\N
153	ASP-Corigliano-Ostetricia e Ginecologia	Ostetricia e Ginecologia	Materno Infantile	ASP	59	\N
154	ASP-Cosenza-Distretto C.S. 	Distretto	Servizio	ASP	64	\N
155	ASP-Distretto-Scalea	Distretto	Servizio	ASP	65	\N
156	ASP-Lungro-Distretto	Distretto	Servizio	ASP	66	\N
157	ASP-Paola-Blocco Operatorio	Blocco Operatorio	Area Critica	ASP	67	\N
158	ASP-Paola-Cardiologia/utic	Cardiologia/UTIC	Medicina Specialistica	ASP	67	\N
159	ASP-Paola-Chirurgia	Chirurgia	Chirurgia	ASP	67	\N
160	ASP-Paola-Distretto	Distretto	Servizio	ASP	67	\N
161	ASP-Paola-Medicina	Medicina	Medicina	ASP	67	\N
162	ASP-Paola-Oncologia	Oncologia	Medicina Specialistica	ASP	67	\N
163	ASP-Paola-Ortopedia	Ortopedia	Chirurgia Specialistica	ASP	67	\N
164	ASP-Praia a mare-Distretto	Distretto	Servizio	ASP	74	\N
165	ASP-Praia a mare-Medicina	Medicina	Medicina	ASP	74	\N
166	ASP-Rende-Distretto Quattromiglia	Distretto	Servizio	ASP	1	\N
167	ASP-Rossano-Cardiologia/utic	Cardiologia/UTIC	Medicina Specialistica	ASP	77	\N
168	ASP-Rossano-Chirurgia generale	Chirurgia generale	Chirurgia	ASP	77	\N
169	ASP-Rossano-Distretto	Distretto	Servizio	ASP	77	\N
170	ASP-Rossano-Oculistica	Oculistica	Chirurgia Specialistica	ASP	77	\N
172	ASP-Rossano-Ortopedia	Ortopedia	Chirurgia Specialistica	ASP	77	\N
175	ASP-San Giovanni in fiore-Medicina	Medicina	Medicina	ASP	83	\N
176	ASP-Scalea-Poliambulatorio	Poliambulatorio	Servizio	ASP	65	\N
91	AOCs-Broncoscopia	Broncoscopia	Servizio	AOCs	1	\N
92	AOCs-Cardiologia UTIC	Cardiologia UTIC	Area Critica	AOCs	1	\N
93	AOCs-Cardiologia Degenza	Cardiologia Degenza	Medicina	AOCs	1	\N
94	AOCs-Cardiologia Interventistica	Cardiologia Interventistica	Medicina Specialistica	AOCs	1	\N
95	AOCs-Cardiologia ambulatorio	Cardiologia ambulatorio	Servizio	AOCs	1	\N
96	AOCs-Chirugia generale	Chirugia generale	Chirurgia	AOCs	1	\N
97	AOCs-Chirurgia d'urgenza	Chirurgia d'urgenza	Chirurgia	AOCs	1	\N
98	AOCs-Chirurgia Toracica	Chirurgia Toracica	Chirurgia Specialistica	AOCs	1	\N
99	AOCs-Chirurgia Vascolare	Chirurgia Vascolare	Chirurgia Specialistica	AOCs	1	\N
100	AOCs-Dermatologia	Dermatologia	Servizio	AOCs	1	\N
101	AOCs-Ematologia	Ematologia	Medicina Specialistica	AOCs	1	\N
102	AOCs-Endoscopia	Endoscopia	Servizio	AOCs	1	\N
103	AOCs-Gastroenterologia	Gastroenterologia	Medicina	AOCs	1	\N
104	AOCs-Geriatria	Geriatria	Medicina	AOCs	1	\N
105	AOCs-Medicina d'urgenza	Medicina d'urgenza	Medicina Specialistica	AOCs	1	\N
106	AOCs-Medicina ex obi	Medicina ex obi	Medicina	AOCs	1	\N
107	AOCs-Medicina Valentini	Medicina Valentini	Medicina	AOCs	1	\N
108	AOCs-Neurologia	Neurologia	Medicina Specialistica	AOCs	1	\N
109	AOCS-OBI	OBI	Medicina Specialistica	AOCs	1	\N
110	AOCs-Oculistica	Oculistica	Chirurgia Specialistica	AOCs	1	\N
111	AOCs-Oncologia	Oncologia	Medicina Specialistica	AOCs	1	\N
112	AOCs-Ortopedia	Ortopedia	Chirurgia Specialistica	AOCs	1	\N
113	AOCs-Pneumologia	Pneumologia	Medicina Specialistica	AOCs	1	\N
114	AOCs-Poliambulatorio	Poliambulatorio	Servizio	AOCs	1	\N
115	AOCs-Terapia del Dolore	Terapia del Dolore	Medicina Specialistica	AOCs	1	\N
116	AOCs-Urologia	Urologia	Chirurgia Specialistica	AOCs	1	\N
117	AOCs-Pronto Soccorso	Pronto Soccorso	Area Critica	AOCs	1	\N
118	AOCs-Terapia Intensiva - Rianimazione	Rianimazione	Area Critica	AOCs	1	\N
119	AOCs-Terapia Intens Neonatale	Terapia Intens Neonatale	Area Critica	AOCs	1	\N
120	AOCs-Neonatologia	Neonatologia	Materno Infantile	AOCs	1	\N
121	AOCs-Pediatria	Pediatria	Materno Infantile	AOCs	1	\N
122	AOCs-Chirurgia pediatrica	Chirurgia pediatrica	Materno Infantile	AOCs	1	\N
123	AOCs-Ginecologia	Ginecologia	Materno Infantile	AOCs	1	\N
124	AOCs-S.O. Ginecologia	S.O. Ginecologia	Area Critica	AOCs	1	\N
125	AOCs-Sala Parto	Sala Parto	Materno Infantile	AOCs	1	\N
126	AOCs-Pronto Soccorso-Ostetricia	Pronto Soccorso	Materno Infantile	AOCs	1	\N
127	AOCs-Ostetricia-A	Ostetricia	Materno Infantile	AOCs	1	\N
174	ASP-San Giovanni in fiore-Distretto	Distretto	Servizio	ASP	83	\N
178	ASP-Trebisacce-Medicina	Medicina	Medicina	ASP	87	3
177	ASP-Trebisacce-Day surgery	Day Surgery	Chirurgia	ASP	87	4
171	ASP-Rossano-Oncologia	Oncologia	Medicina Specialistica	ASP	77	2
173	ASP-San Giovanni in fiore-Chirurgia	Chirurgia	Chirurgia	ASP	83	\N
128	AOCs-Ostetricia-B	Ostetricia	Materno Infantile	AOCs	1	\N
129	AOCs-Blocco Operatorio	Blocco Operatorio	Area Critica	AOCs	1	\N
130	AOCs-Nefrologia-Dialisi	Dialisi	Medicina Specialistica	AOCs	1	\N
131	AOCs-Malattie Infettive	Malattie Infettive	Medicina Specialistica	AOCs	1	\N
132	AOCs-Neurochirurgia	Neurochirurgia	Chirurgia Specialistica	AOCs	1	\N
133	AOCs-SIT	SIT	Servizio	AOCs	1	\N
179	INRCA-Geriatria	Geriatria	Medicina	INCRA	1	2
180	INRCA-Riabilitazione	Riabilitazione	Medicina	INCRA	1	3
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, number, email, encoded_password, name, surname, enrollment_year, outstanding_otp, outstanding_otp_expires_at, new_email, mfa_secret, accepted, registered_at, role) FROM stdin;
507	554432	giovanni.lombardi@example.com	\N	Giovanni	Lombardi	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
508	101200	nicolo.paci@example.com	\N	Nicolò	Paci	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
509	101460	beba.costa@example.com	\N	Beba	Costa	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
510	101459	adam.gatti@example.com	\N	Adam	Gatti	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
511	101458	zelda.longo@example.com	\N	Zelda	Longo	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
512	101457	yago.rizzo@example.com	\N	Yago	Rizzo	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
513	101456	xenia.marino@example.com	\N	Xenia	Marino	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
514	101455	walter.poggi@example.com	\N	Walter	Poggi	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
515	101454	valeria.riva@example.com	\N	Valeria	Riva	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
516	101453	ulisse.serra@example.com	\N	Ulisse	Serra	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
517	101452	tessa.grillo@example.com	\N	Tessa	Grillo	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
518	101451	simone.carli@example.com	\N	Simone	Carli	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
519	101450	rita.monti@example.com	\N	Rita	Monti	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
520	101449	quinn.bevilacqua@example.com	\N	Quinn	Bevilacqua	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
521	101448	pietro.vico@example.com	\N	Pietro	Vico	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
522	101447	olivia.mora@example.com	\N	Olivia	Mora	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
523	101446	nicola.neri@example.com	\N	Nicola	Neri	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
524	101445	martina.pari@example.com	\N	Martina	Pari	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
525	101442	giulio.paci@example.com	\N	Giulio	Paci	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
526	101441	fabiana.valenti@example.com	\N	Fabiana	Valenti	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
527	101440	enrico.basso@example.com	\N	Enrico	Basso	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
528	101438	cosimo.festa@example.com	\N	Cosimo	Festa	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
529	101437	beba.vitali@example.com	\N	Beba	Vitali	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
530	101436	adam.belli@example.com	\N	Adam	Belli	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
531	101435	zelda.rubino@example.com	\N	Zelda	Rubino	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
532	101433	xenia.costa@example.com	\N	Xenia	Costa	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
533	101432	walter.gatti@example.com	\N	Walter	Gatti	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
534	101431	valeria.longo@example.com	\N	Valeria	Longo	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
535	101430	ulisse.rizzo@example.com	\N	Ulisse	Rizzo	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
536	101429	tessa.marino@example.com	\N	Tessa	Marino	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
537	101428	simone.poggi@example.com	\N	Simone	Poggi	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
538	101427	rita.riva@example.com	\N	Rita	Riva	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
539	101426	quinn.serra@example.com	\N	Quinn	Serra	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
540	101425	pietro.grillo@example.com	\N	Pietro	Grillo	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
541	101424	olivia.carli@example.com	\N	Olivia	Carli	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
542	101423	nicola.monti@example.com	\N	Nicola	Monti	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
543	101422	martina.bevilacqua@example.com	\N	Martina	Bevilacqua	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
544	101421	leonardo.vico@example.com	\N	Leonardo	Vico	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
545	101420	ilaria.mora@example.com	\N	Ilaria	Mora	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
546	101419	giulio.neri@example.com	\N	Giulio	Neri	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
547	101418	fabiana.pari@example.com	\N	Fabiana	Pari	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
548	101417	enrico.farina@example.com	\N	Enrico	Farina	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
549	101416	dora.rossini@example.com	\N	Dora	Rossini	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
550	101415	cosimo.paci@example.com	\N	Cosimo	Paci	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
551	101414	beba.valenti@example.com	\N	Beba	Valenti	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
553	101411	yago.festa@example.com	\N	Yago	Festa	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
554	101410	xenia.vitali@example.com	\N	Xenia	Vitali	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
555	101409	walter.belli@example.com	\N	Walter	Belli	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
556	101408	valeria.rubino@example.com	\N	Valeria	Rubino	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
557	101401	olivia.poggi@example.com	\N	Olivia	Poggi	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
558	101399	martina.serra@example.com	\N	Martina	Serra	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
559	101398	leonardo.grillo@example.com	\N	Leonardo	Grillo	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
560	101397	ilaria.carli@example.com	\N	Ilaria	Carli	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
561	101396	giulio.monti@example.com	\N	Giulio	Monti	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
562	101395	fabiana.bevilacqua@example.com	\N	Fabiana	Bevilacqua	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
563	101386	walter.basso@example.com	\N	Walter	Basso	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
564	101385	valeria.mora@example.com	\N	Valeria	Mora	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
565	101384	ulisse.festa@example.com	\N	Ulisse	Festa	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
566	101383	tessa.vitali@example.com	\N	Tessa	Vitali	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
567	101382	simone.belli@example.com	\N	Simone	Belli	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
568	101381	rita.rubino@example.com	\N	Rita	Rubino	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
569	101380	quinn.pavan@example.com	\N	Quinn	Pavan	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
570	101379	pietro.costa@example.com	\N	Pietro	Costa	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
571	101378	olivia.gatti@example.com	\N	Olivia	Gatti	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
572	101377	nicola.longo@example.com	\N	Nicola	Longo	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
573	101376	manuela.rizzo@example.com	\N	Manuela	Rizzo	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
574	101375	leonardo.marino@example.com	\N	Leonardo	Marino	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
575	101374	ilaria.poggi@example.com	\N	Ilaria	Poggi	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
576	101373	giulio.riva@example.com	\N	Giulio	Riva	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
577	101372	federica.serra@example.com	\N	Federica	Serra	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
578	101371	enrico.grillo@example.com	\N	Enrico	Grillo	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
579	101370	daniela.carli@example.com	\N	Daniela	Carli	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
580	101369	claudio.monti@example.com	\N	Claudio	Monti	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
581	101368	beatrice.bevilacqua@example.com	\N	Beatrice	Bevilacqua	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
552	101413	adam.basso@example.com	\N	Adam	Basso	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
583	101366	zelda.mora@example.com	\N	Zelda	Mora	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
584	101365	walter.neri@example.com	\N	Walter	Neri	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
585	101364	vera.pari@example.com	\N	Vera	Pari	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
586	101363	ugo.farina@example.com	\N	Ugo	Farina	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
587	101362	tania.rossini@example.com	\N	Tania	Rossini	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
588	101361	stefano.paci@example.com	\N	Stefano	Paci	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
589	101360	rocco.valenti@example.com	\N	Rocco	Valenti	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
590	101359	quibila.basso@example.com	\N	Quibila	Basso	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
591	101358	pamela.mora@example.com	\N	Pamela	Mora	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
592	101357	orazio.festa@example.com	\N	Orazio	Festa	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
593	101356	nadia.vitali@example.com	\N	Nadia	Vitali	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
594	101355	manuela.belli@example.com	\N	Manuela	Belli	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
595	101354	leonardo.rubino@example.com	\N	Leonardo	Rubino	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
596	101353	ilaria.pavan@example.com	\N	Ilaria	Pavan	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
597	101352	gabriele.costa@example.com	\N	Gabriele	Costa	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
598	101351	federica.gatti@example.com	\N	Federica	Gatti	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
599	101350	eugenio.longo@example.com	\N	Eugenio	Longo	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
600	101349	daniela.rizzo@example.com	\N	Daniela	Rizzo	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
601	101348	claudio.marino@example.com	\N	Claudio	Marino	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
602	101347	beatrice.poggi@example.com	\N	Beatrice	Poggi	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
604	101345	zaccaria.serra@example.com	\N	Zaccaria	Serra	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
605	101344	ylenia.grillo@example.com	\N	Ylenia	Grillo	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
606	101342	vittorio.monti@example.com	\N	Vittorio	Monti	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
607	101341	ursula.bevilacqua@example.com	\N	Ursula	Bevilacqua	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
608	101340	tiziano.vico@example.com	\N	Tiziano	Vico	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
609	101339	samuel.mora@example.com	\N	Samuel	Mora	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
610	101338	rebecca.neri@example.com	\N	Rebecca	Neri	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
611	101336	paolo.farina@example.com	\N	Paolo	Farina	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
612	101335	olivia.rossini@example.com	\N	Olivia	Rossini	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
613	101329	isabel.vitali@example.com	\N	Isabel	Vitali	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
614	101327	giorgia.rubino@example.com	\N	Giorgia	Rubino	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
615	101325	elena.costa@example.com	\N	Elena	Costa	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
616	101324	duccio.gatti@example.com	\N	Duccio	Gatti	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
617	101323	carla.longo@example.com	\N	Carla	Longo	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
618	101322	biagio.rizzo@example.com	\N	Biagio	Rizzo	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
619	101321	arianna.marino@example.com	\N	Arianna	Marino	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
620	101320	zaira.poggi@example.com	\N	Zaira	Poggi	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
621	101319	virginia.riva@example.com	\N	Virginia	Riva	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
622	101318	ulderico.serra@example.com	\N	Ulderico	Serra	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
623	101317	tullio.grillo@example.com	\N	Tullio	Grillo	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
624	101316	sabrina.carli@example.com	\N	Sabrina	Carli	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
625	101315	rocco.monti@example.com	\N	Rocco	Monti	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
626	101314	quibila.bevilacqua@example.com	\N	Quibila	Bevilacqua	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
627	101313	pamela.vico@example.com	\N	Pamela	Vico	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
628	101312	orazio.mora@example.com	\N	Orazio	Mora	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
629	101311	nadia.neri@example.com	\N	Nadia	Neri	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
630	101310	manuela.pari@example.com	\N	Manuela	Pari	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
631	101309	leonardo.farina@example.com	\N	Leonardo	Farina	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
632	101308	ilaria.rossini@example.com	\N	Ilaria	Rossini	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
633	101307	gabriele.paci@example.com	\N	Gabriele	Paci	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
634	101306	federica.valenti@example.com	\N	Federica	Valenti	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
635	101305	eugenio.basso@example.com	\N	Eugenio	Basso	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
636	101304	daniela.mora@example.com	\N	Daniela	Mora	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
637	101303	claudio.festa@example.com	\N	Claudio	Festa	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
638	101302	beatrice.vitali@example.com	\N	Beatrice	Vitali	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
640	101300	zelinda.rubino@example.com	\N	Zelinda	Rubino	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
641	101299	yago.pavan@example.com	\N	Yago	Pavan	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
642	101298	wilma.costa@example.com	\N	Wilma	Costa	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
643	101297	valerio.gatti@example.com	\N	Valerio	Gatti	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
644	101296	ursula.longo@example.com	\N	Ursula	Longo	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
645	101295	tommaso.rizzo@example.com	\N	Tommaso	Rizzo	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
646	101294	serena.marino@example.com	\N	Serena	Marino	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
647	101293	roberto.poggi@example.com	\N	Roberto	Poggi	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
648	101292	quibila.riva@example.com	\N	Quibila	Riva	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
649	101291	pietro.serra@example.com	\N	Pietro	Serra	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
650	101290	olivia.grillo@example.com	\N	Olivia	Grillo	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
651	101289	nicola.carli@example.com	\N	Nicola	Carli	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
652	101288	monica.monti@example.com	\N	Monica	Monti	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
653	101287	lorenzo.bevilacqua@example.com	\N	Lorenzo	Bevilacqua	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
654	101286	ilaria.vico@example.com	\N	Ilaria	Vico	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
655	101285	giulio.mora@example.com	\N	Giulio	Mora	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
656	101284	federica.neri@example.com	\N	Federica	Neri	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
657	101283	enrico.pari@example.com	\N	Enrico	Pari	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
658	101282	daniela.farina@example.com	\N	Daniela	Farina	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
603	101346	adriano.riva@example.com	\N	Adriano	Riva	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
659	101281	claudio.rossini@example.com	\N	Claudio	Rossini	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
660	101280	beatrice.paci@example.com	\N	Beatrice	Paci	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
662	101278	zelda.basso@example.com	\N	Zelda	Basso	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
663	101277	yago.mora@example.com	\N	Yago	Mora	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
664	101276	xenia.festa@example.com	\N	Xenia	Festa	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
665	101275	walter.vitali@example.com	\N	Walter	Vitali	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
666	101274	valeria.belli@example.com	\N	Valeria	Belli	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
667	101273	ulisse.rubino@example.com	\N	Ulisse	Rubino	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
668	101272	tessa.pavan@example.com	\N	Tessa	Pavan	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
669	101271	simone.costa@example.com	\N	Simone	Costa	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
670	101270	rita.gatti@example.com	\N	Rita	Gatti	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
671	101269	quinn.longo@example.com	\N	Quinn	Longo	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
672	101268	pietro.rizzo@example.com	\N	Pietro	Rizzo	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
673	101267	olivia.marino@example.com	\N	Olivia	Marino	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
674	101266	nicola.poggi@example.com	\N	Nicola	Poggi	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
675	101265	martina.riva@example.com	\N	Martina	Riva	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
676	101264	leonardo.serra@example.com	\N	Leonardo	Serra	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
677	101263	ilaria.grillo@example.com	\N	Ilaria	Grillo	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
678	101262	giulio.carli@example.com	\N	Giulio	Carli	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
679	101261	fabiana.monti@example.com	\N	Fabiana	Monti	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
680	101260	enrico.vico@example.com	\N	Enrico	Vico	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
681	101259	dora.mora@example.com	\N	Dora	Mora	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
682	101258	cosimo.neri@example.com	\N	Cosimo	Neri	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
683	101257	beba.pari@example.com	\N	Beba	Pari	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
684	101255	zelda.rossini@example.com	\N	Zelda	Rossini	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
685	101254	yago.paci@example.com	\N	Yago	Paci	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
686	101253	xenia.valenti@example.com	\N	Xenia	Valenti	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
687	101252	wanda.basso@example.com	\N	Wanda	Basso	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
688	101251	vasco.mora@example.com	\N	Vasco	Mora	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
689	101250	unice.festa@example.com	\N	Unice	Festa	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
690	101249	tobia.vitali@example.com	\N	Tobia	Vitali	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
691	101248	sofia.belli@example.com	\N	Sofia	Belli	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
692	101247	raul.rubino@example.com	\N	Raul	Rubino	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
693	101246	perla.pavan@example.com	\N	Perla	Pavan	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
694	101245	omar.costa@example.com	\N	Omar	Costa	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
695	101244	nadia.gatti@example.com	\N	Nadia	Gatti	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
696	101243	mirko.longo@example.com	\N	Mirko	Longo	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
697	101242	lara.rizzo@example.com	\N	Lara	Rizzo	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
698	101241	ivan.marino@example.com	\N	Ivan	Marino	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
699	101240	helga.poggi@example.com	\N	Helga	Poggi	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
700	101239	gianluca.riva@example.com	\N	Gianluca	Riva	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
701	101238	fiorella.serra@example.com	\N	Fiorella	Serra	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
702	101237	emilio.grillo@example.com	\N	Emilio	Grillo	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
703	101236	diana.carli@example.com	\N	Diana	Carli	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
704	101235	carlo.monti@example.com	\N	Carlo	Monti	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
705	101234	bianca.bevilacqua@example.com	\N	Bianca	Bevilacqua	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
706	101233	antonio.vico@example.com	\N	Antonio	Vico	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
707	101232	zelinda.mora@example.com	\N	Zelinda	Mora	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
708	101231	yago.neri@example.com	\N	Yago	Neri	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
709	101230	wilma.pari@example.com	\N	Wilma	Pari	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
710	101229	valerio.farina@example.com	\N	Valerio	Farina	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
711	101228	ursula.rossini@example.com	\N	Ursula	Rossini	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
712	101227	tommaso.paci@example.com	\N	Tommaso	Paci	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
713	101225	roberto.basso@example.com	\N	Roberto	Basso	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
714	101224	quibila.mora@example.com	\N	Quibila	Mora	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
715	101223	pietro.festa@example.com	\N	Pietro	Festa	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
716	101222	olivia.vitali@example.com	\N	Olivia	Vitali	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
717	101221	nicola.belli@example.com	\N	Nicola	Belli	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
718	101220	monica.rubino@example.com	\N	Monica	Rubino	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
719	101219	lorenzo.pavan@example.com	\N	Lorenzo	Pavan	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
720	101218	ilaria.costa@example.com	\N	Ilaria	Costa	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
721	101217	giulio.gatti@example.com	\N	Giulio	Gatti	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
722	101216	federica.longo@example.com	\N	Federica	Longo	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
723	101215	enrico.rizzo@example.com	\N	Enrico	Rizzo	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
724	101214	daniela.marino@example.com	\N	Daniela	Marino	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
725	101213	claudio.poggi@example.com	\N	Claudio	Poggi	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
726	101212	beatrice.riva@example.com	\N	Beatrice	Riva	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
728	101210	zelda.grillo@example.com	\N	Zelda	Grillo	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
729	101209	walter.carli@example.com	\N	Walter	Carli	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
730	101206	tania.vico@example.com	\N	Tania	Vico	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
731	101205	stefano.mora@example.com	\N	Stefano	Mora	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
732	101204	rita.neri@example.com	\N	Rita	Neri	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
733	101203	quinto.pari@example.com	\N	Quinto	Pari	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
734	101202	paola.farina@example.com	\N	Paola	Farina	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
735	101201	oscar.rossini@example.com	\N	Oscar	Rossini	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
736	101199	marta.valenti@example.com	\N	Marta	Valenti	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
737	101198	luca.basso@example.com	\N	Luca	Basso	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
738	101197	karin.mora@example.com	\N	Karin	Mora	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
739	101196	jacopo.festa@example.com	\N	Jacopo	Festa	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
740	101195	ida.vitali@example.com	\N	Ida	Vitali	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
741	101194	hermes.belli@example.com	\N	Hermes	Belli	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
742	101193	gaia.rubino@example.com	\N	Gaia	Rubino	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
743	101192	filippo.pavan@example.com	\N	Filippo	Pavan	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
744	101191	erika.costa@example.com	\N	Erika	Costa	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
745	101190	dario.gatti@example.com	\N	Dario	Gatti	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
746	101189	clara.longo@example.com	\N	Clara	Longo	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
747	101188	bruno.rizzo@example.com	\N	Bruno	Rizzo	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
749	101186	zita.poggi@example.com	\N	Zita	Poggi	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
750	101185	yuri.riva@example.com	\N	Yuri	Riva	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
751	101184	xenia.serra@example.com	\N	Xenia	Serra	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
752	101183	wanda.grillo@example.com	\N	Wanda	Grillo	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
753	101182	vincenzo.neri@example.com	\N	Vincenzo	Neri	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
754	101181	ulderico.carli@example.com	\N	Ulderico	Carli	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
755	101180	tiziana.monti@example.com	\N	Tiziana	Monti	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
756	101179	saverio.bevilacqua@example.com	\N	Saverio	Bevilacqua	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
757	101178	renee.vico@example.com	\N	Renee	Vico	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
758	101177	quinn.mora@example.com	\N	Quinn	Mora	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
759	101176	paride.pari@example.com	\N	Paride	Pari	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
760	101175	ottavia.re@example.com	\N	Ottavia	Re	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
761	101174	noah.lupo@example.com	\N	Noah	Lupo	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
762	101173	mirko.rizzi@example.com	\N	Mirko	Rizzi	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
763	101172	loredana.bassi@example.com	\N	Loredana	Bassi	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
764	101171	karim.pelle@example.com	\N	Karim	Pelle	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
765	101170	jasmine.duca@example.com	\N	Jasmine	Duca	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
766	101169	italo.ponti@example.com	\N	Italo	Ponti	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
767	101168	hilde.ferri@example.com	\N	Hilde	Ferri	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
768	101167	gregorio.greco@example.com	\N	Gregorio	Greco	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
769	101166	fabiana.bosco@example.com	\N	Fabiana	Bosco	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
770	101165	elio.sarti@example.com	\N	Elio	Sarti	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
771	101164	dorotea.marra@example.com	\N	Dorotea	Marra	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
772	101163	cosimo.fiori@example.com	\N	Cosimo	Fiori	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
773	101162	barbara.malta@example.com	\N	Barbara	Malta	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
775	101160	isabel.reale@example.com	\N	Isabel	Reale	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
776	101159	hermes.vitali@example.com	\N	Hermes	Vitali	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
777	101158	giorgia.festa@example.com	\N	Giorgia	Festa	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
778	101157	filippo.dandrea@example.com	\N	Filippo	D'Andrea	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
779	101156	elena.rinaldi@example.com	\N	Elena	Rinaldi	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
780	101155	duccio.serra@example.com	\N	Duccio	Serra	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
781	101154	carla.lombardo@example.com	\N	Carla	Lombardo	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
782	101153	biagio.giordano@example.com	\N	Biagio	Giordano	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
783	101152	arianna.gentile@example.com	\N	Arianna	Gentile	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
784	101151	zaira.pellegrino@example.com	\N	Zaira	Pellegrino	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
785	101150	virginia.ferretti@example.com	\N	Virginia	Ferretti	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
786	101149	ulderico.marini@example.com	\N	Ulderico	Marini	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
787	101148	tullio.caruso@example.com	\N	Tullio	Caruso	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
788	101147	sabrina.farina@example.com	\N	Sabrina	Farina	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
789	101146	rocco.sorrentino@example.com	\N	Rocco	Sorrentino	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
790	101145	quibila.pagano@example.com	\N	Quibila	Pagano	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
791	101120	nicolo.reale@example.com	\N	Nicolò	Reale	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
792	101144	pamela.morelli@example.com	\N	Pamela	Morelli	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
793	101143	orazio.bianco@example.com	\N	Orazio	Bianco	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
794	101142	nadia.rossini@example.com	\N	Nadia	Rossini	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
795	101141	manuela.fabbri@example.com	\N	Manuela	Fabbri	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
796	101140	leonardo.pari@example.com	\N	Leonardo	Pari	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
797	101139	ilaria.donati@example.com	\N	Ilaria	Donati	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
798	101138	gabriele.pagano@example.com	\N	Gabriele	Pagano	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
799	101136	eugenio.mancino@example.com	\N	Eugenio	Mancino	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
800	101135	daniela.romano@example.com	\N	Daniela	Romano	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
801	101134	claudio.conte@example.com	\N	Claudio	Conte	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
802	101133	beatrice.villa@example.com	\N	Beatrice	Villa	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
804	101131	zaccaria.deluca@example.com	\N	Zaccaria	De Luca	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
805	101130	ylenia.fiore@example.com	\N	Ylenia	Fiore	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
806	101129	walter.parisi@example.com	\N	Walter	Parisi	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
807	101128	vittorio.grasso@example.com	\N	Vittorio	Grasso	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
808	101127	ursula.battaglia@example.com	\N	Ursula	Battaglia	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
809	101126	tiziano.greco@example.com	\N	Tiziano	Greco	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
810	101125	samuel.damico@example.com	\N	Samuel	D'Amico	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
811	101124	rebecca.guerra@example.com	\N	Rebecca	Guerra	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
803	101132	adriano.pinto@example.com	\N	Adriano	Pinto	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
812	101123	quinto.martini@example.com	\N	Quinto	Martini	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
813	101121	olivia.barone@example.com	\N	Olivia	Barone	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
814	101119	marta.vitali@example.com	\N	Marta	Vitali	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
815	101118	luca.festa@example.com	\N	Luca	Festa	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
816	101117	karin.dandrea@example.com	\N	Karin	D'Andrea	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
817	101116	jacopo.rinaldi@example.com	\N	Jacopo	Rinaldi	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
818	101115	ivan.serra@example.com	\N	Ivan	Serra	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
819	101114	hugo.lombardo@example.com	\N	Hugo	Lombardo	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
820	101113	giada.giordano@example.com	\N	Giada	Giordano	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
821	101112	fabrizio.gentile@example.com	\N	Fabrizio	Gentile	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
822	101111	erika.pellegrino@example.com	\N	Erika	Pellegrino	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
823	101110	dora.ferretti@example.com	\N	Dora	Ferretti	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
824	101109	cosimo.marini@example.com	\N	Cosimo	Marini	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
825	101108	beba.caruso@example.com	\N	Beba	Caruso	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
827	101106	zelda.sorrentino@example.com	\N	Zelda	Sorrentino	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
828	101105	yago.pagano@example.com	\N	Yago	Pagano	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
829	101104	xenia.morelli@example.com	\N	Xenia	Morelli	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
830	101103	wanda.bianco@example.com	\N	Wanda	Bianco	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
831	101102	vasco.rossini@example.com	\N	Vasco	Rossini	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
832	101101	unice.fabbri@example.com	\N	Unice	Fabbri	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
833	101100	tobia.moretti@example.com	\N	Tobia	Moretti	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
834	101099	sofia.donati@example.com	\N	Sofia	Donati	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
835	101098	raul.molinari@example.com	\N	Raul	Molinari	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
836	101097	perla.serra@example.com	\N	Perla	Serra	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
837	101096	omar.patti@example.com	\N	Omar	Patti	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
838	101095	noemi.barbieri@example.com	\N	Noemi	Barbieri	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
839	101094	mirko.gatti@example.com	\N	Mirko	Gatti	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
840	101092	ivan.leone@example.com	\N	Ivan	Leone	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
841	101091	hilda.rizzo@example.com	\N	Hilda	Rizzo	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
842	101090	gino.moretti@example.com	\N	Gino	Moretti	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
843	101089	fiona.gallo@example.com	\N	Fiona	Gallo	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
844	101088	elio.rizzi@example.com	\N	Elio	Rizzi	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
845	101087	doriana.basso@example.com	\N	Doriana	Basso	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
846	101086	cesare.mora@example.com	\N	Cesare	Mora	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
847	101085	bruna.festa@example.com	\N	Bruna	Festa	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
848	101084	attilio.vitali@example.com	\N	Attilio	Vitali	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
849	101083	zaira.belli@example.com	\N	Zaira	Belli	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
850	101082	vanna.rubino@example.com	\N	Vanna	Rubino	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
851	101081	ulisse.pavan@example.com	\N	Ulisse	Pavan	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
852	101080	tessa.costa@example.com	\N	Tessa	Costa	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
853	101079	sante.gatti@example.com	\N	Sante	Gatti	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
854	101078	rita.longo@example.com	\N	Rita	Longo	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
855	101077	quinn.rizzo@example.com	\N	Quinn	Rizzo	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
856	101076	pietro.marino@example.com	\N	Pietro	Marino	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
857	101075	osvaldo.poggi@example.com	\N	Osvaldo	Poggi	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
858	101074	nadia.riva@example.com	\N	Nadia	Riva	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
859	101073	miriam.serra@example.com	\N	Miriam	Serra	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
860	101072	leone.grillo@example.com	\N	Leone	Grillo	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
861	101071	katia.carli@example.com	\N	Katia	Carli	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
862	101070	jole.monti@example.com	\N	Jole	Monti	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
863	101069	igor.bevilacqua@example.com	\N	Igor	Bevilacqua	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
864	101068	helen.vico@example.com	\N	Helen	Vico	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
865	101067	gianni.mora@example.com	\N	Gianni	Mora	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
866	101066	fulvia.neri@example.com	\N	Fulvia	Neri	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
867	101065	elvio.pari@example.com	\N	Elvio	Pari	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
868	101064	dino.farina@example.com	\N	Dino	Farina	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
869	101063	catia.rossini@example.com	\N	Catia	Rossini	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
870	101062	boris.paci@example.com	\N	Boris	Paci	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
871	101061	anna.valenti@example.com	\N	Anna	Valenti	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
873	101060	vito.basso@example.com	\N	Vito	Basso	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
874	101059	uva.mora@example.com	\N	Uva	Mora	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
875	101058	tino.festa@example.com	\N	Tino	Festa	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
876	101057	sara.vitali@example.com	\N	Sara	Vitali	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
877	101056	remo.belli@example.com	\N	Remo	Belli	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
881	101052	mario.gatti@example.com	\N	Mario	Gatti	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
882	101051	lara.longo@example.com	\N	Lara	Longo	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
883	101050	guido.rizzo@example.com	\N	Guido	Rizzo	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
884	101049	flora.marino@example.com	\N	Flora	Marino	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
885	101048	ester.poggi@example.com	\N	Ester	Poggi	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
886	101047	dario.riva@example.com	\N	Dario	Riva	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
887	101046	clara.serra@example.com	\N	Clara	Serra	2024	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
888	101045	beppe.grillo@example.com	\N	Beppe	Grillo	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
826	101107	adam.farina@example.com	\N	Adam	Farina	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
878	101055	pia.rubino@example.com	\N	Pia	Rubino	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
879	101054	omar.pavan@example.com	\N	Omar	Pavan	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
896	101037	quinto.re@example.com	\N	Quinto	Re	2022	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
897	101036	piero.lupo@example.com	\N	Piero	Lupo	2023	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
898	101035	olga.rizzi@example.com	\N	Olga	Rizzi	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
901	101031	ilda.ponti@example.com	\N	Ilda	Ponti	2021	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
905	101027	emma.sarti@example.com	\N	Emma	Sarti	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
906	101026	diego.marra@example.com	\N	Diego	Marra	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
907	101025	carla.fiori@example.com	\N	Carla	Fiori	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
908	101024	bruno.malta@example.com	\N	Bruno	Malta	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
909	101023	adele.fonti@example.com	\N	Adele	Fonti	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
910	101022	zara.bianchi@example.com	\N	Zara	Bianchi	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
911	101021	yuri.rossi@example.com	\N	Yuri	Rossi	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
912	101020	walter.biagi@example.com	\N	Walter	Biagi	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
913	101019	valeria.conti@example.com	\N	Valeria	Conti	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
914	101018	umberto.valla@example.com	\N	Umberto	Valla	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
915	101017	tania.galli@example.com	\N	Tania	Galli	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
916	101016	sergio.negri@example.com	\N	Sergio	Negri	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
917	101015	irene.sala@example.com	\N	Irene	Sala	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
918	101014	oscar.neri@example.com	\N	Oscar	Neri	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
928	565758	angelo.pinto@example.com	\N	Angelo	Pinto	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
931	474849	michela.parisi@example.com	\N	Michela	Parisi	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
932	444546	davide.grasso@example.com	\N	Davide	Grasso	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
933	414243	cinzia.battaglia@example.com	\N	Cinzia	Battaglia	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
934	383940	massimo.greco@example.com	\N	Massimo	Greco	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
935	353637	giulia.damico@example.com	\N	Giulia	D'Amico	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
936	323334	roberto.guerra@example.com	\N	Roberto	Guerra	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
938	262728	fabrizio.palumbo@example.com	\N	Fabrizio	Palumbo	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
939	232425	daniela.barone@example.com	\N	Daniela	Barone	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
940	202122	maurizio.reale@example.com	\N	Maurizio	Reale	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
941	171819	patrizia.vitali@example.com	\N	Patrizia	Vitali	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
942	141516	giulio.festa@example.com	\N	Giulio	Festa	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
943	111213	anna.dandrea@example.com	\N	Anna	D'Andrea	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
944	909900	marco.rinaldi@example.com	\N	Marco	Rinaldi	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
945	808899	simona.serra@example.com	\N	Simona	Serra	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
946	707788	alessio.lombardo@example.com	\N	Alessio	Lombardo	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
947	606677	chiara.giordano@example.com	\N	Chiara	Giordano	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
948	505566	stefano.gentile@example.com	\N	Stefano	Gentile	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
949	404455	laura.pellegrino@example.com	\N	Laura	Pellegrino	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
950	303344	valerio.ferretti@example.com	\N	Valerio	Ferretti	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
951	202233	sabrina.marini@example.com	\N	Sabrina	Marini	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
952	101122	enrico.caruso@example.com	\N	Enrico	Caruso	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
953	990022	cristina.farina@example.com	\N	Cristina	Farina	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
954	889911	matteo.sorrentino@example.com	\N	Matteo	Sorrentino	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
955	778800	elisa.pagano@example.com	\N	Elisa	Pagano	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
958	584736	giulia.romano@example.com	\N	Giulia	Romano	2029	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
959	219348	antonio.lumaca@example.com	\N	Antonio	Lumaca	2029	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
960	667799	luca.morelli@example.com	\N	Luca	Morelli	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
961	556688	nadia.bianco@example.com	\N	Nadia	Bianco	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
1	\N	mario.rossi@example.com	$2b$12$cwSWPJqh1tndpuH.BoZh4e0BjOAqoZZ0I6M/4eT69Btv4Qh4ouRpC	Mario	Rossi	\N	\N	\N	\N	\N	f	2026-05-26 15:06:39.675989	admin
502	\N	camillo.benso@example.com	$2b$12$3riHSB49OUgX6nlMXL5Xqe2p2nvtTN2AS2z/2btoKSp6imFqmZ2XK	Camillo	Benso	\N	\N	\N	\N	\N	f	2026-06-02 19:40:07.619504	admin
962	445577	paolo.rossini@example.com	\N	Paolo	Rossini	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
890	101043	zeno.carli@example.com	\N	Zeno	Carli	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
891	101042	vera.monti@example.com	\N	Vera	Monti	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
899	101033	mara.pelle@example.com	\N	Mara	Pelle	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
900	101032	loris.duca@example.com	\N	Loris	Duca	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
927	596061	silvia.villa@example.com	\N	Silvia	Villa	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
929	535455	roberta.de.luca@example.com	\N	Roberta	De Luca	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
930	505152	salvatore.fiore@example.com	\N	Salvatore	Fiore	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
937	293031	elena.martini@example.com	\N	Elena	Martini	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
924	686970	ivan.mancino@example.com	\N	Ivan	Mancino	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
925	656667	barbara.romano@example.com	\N	Barbara	Romano	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
926	626364	gianluca.conte@example.com	\N	Gianluca	Conte	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
921	101011	manuela.boni@example.com	\N	Manuela	Boni	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
922	747576	tommaso.pagano@example.com	\N	Tommaso	Pagano	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
923	717273	federica.costantini@example.com	\N	Federica	Costantini	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
919	101013	sabina.riva@example.com	\N	Sabina	Riva	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
920	101012	riccardo.pini@example.com	\N	Riccardo	Pini	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
902	101030	hugo.ferri@example.com	\N	Hugo	Ferri	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
903	101029	gina.greco@example.com	\N	Gina	Greco	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
904	101028	fabio.bosco@example.com	\N	Fabio	Bosco	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
956	293817	giuseppe.verdi@example.com	\N	Giuseppe	Verdi	2022	513219	2026-06-27 11:09:29.048	\N	\N	t	2026-06-03 14:56:59.47382	student
504	\N	giuseppe.garibaldi@example.com	$2b$12$uo0NqhXlmPD.qHX9wdyCN.YG7i1lMSxrhImHNKbvCUvTDmhXKseNa	Garibaldi	Garibaldi	\N	\N	\N	\N	\N	f	2026-06-02 19:50:01.191156	admin
963	334466	monica.fabbri@example.com	\N	Monica	Fabbri	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
964	223355	claudio.pari@example.com	\N	Claudio	Pari	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
965	112244	stefania.donati@example.com	\N	Stefania	Donati	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
966	357159	gaia.bellini@example.com	\N	Gaia	Bellini	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
967	951753	fabio.peroni@example.com	\N	Fabio	Peroni	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
968	456852	arianna.rizzi@example.com	\N	Arianna	Rizzi	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
969	852456	edoardo.basso@example.com	\N	Edoardo	Basso	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
970	753159	serena.valenti@example.com	\N	Serena	Valenti	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
971	159357	daniele.salvi@example.com	\N	Daniele	Salvi	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
972	789123	marta.fiore@example.com	\N	Marta	Fiore	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
973	321654	nicola.riva@example.com	\N	Nicola	Riva	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
974	456789	linda.carli@example.com	\N	Linda	Carli	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
975	987654	pietro.negri@example.com	\N	Pietro	Negri	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
976	654321	aurora.poggi@example.com	\N	Aurora	Poggi	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
977	123456	tommaso.greco@example.com	\N	Tommaso	Greco	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
978	775588	elena.monti@example.com	\N	Elena	Monti	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
979	339911	alberto.rubino@example.com	\N	Alberto	Rubino	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
980	662233	giorgia.boschi@example.com	\N	Giorgia	Boschi	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
981	447755	andrea.pavan@example.com	\N	Andrea	Pavan	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
982	192837	silvia.ferri@example.com	\N	Silvia	Ferri	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
983	884736	marco.valli@example.com	\N	Marco	Valli	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
984	273849	camilla.giuliani@example.com	\N	Camilla	Giuliani	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
985	584930	lorenzo.fontana@example.com	\N	Lorenzo	Fontana	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
505	\N	a@b.c	$2b$12$VFo7ystoP.EBFinlq3JGWO7aKAD1NHrxPQ3Eh9c4BHrssoExGtCye	Nome	Cognome	\N	\N	\N	\N	\N	f	2026-06-02 19:54:22.80706	admin
986	338877	sara.marchetti@example.com	\N	Sara	Marchetti	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
957	778898	francesca.longo@example.com	\N	Francesca	Longo	2016	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
872	101034	nino.bassi@example.com	\N	Nino	Bassi	2020	\N	\N	\N	\N	f	2026-06-03 14:56:59.47382	student
991	837467	elisa.volpi@example.com	\N	Elisa	Volpi	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
990	293840	roberta.dangelo@example.com	\N	Roberta	Fansini	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
989	674833	filippo.conti@example.com	\N	Filippo	Conti	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
892	101041	ugo.bevilacqua@example.com	\N	Ugo	Bevilacqua	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
893	101040	tullio.vico@example.com	\N	Tullio	Vico	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
894	101039	sante.mora@example.com	\N	Sante	Mora	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
895	101038	rosa.pari@example.com	\N	Rosa	Pari	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
988	485960	irene.messina@example.com	\N	Irene	Messina	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
987	928374	emanuele.villa@example.com	\N	Emanuele	Villa	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
992	112947	michele.pellegrini@example.com	\N	Michele	Pellegrini	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
993	395827	claudia.mancini@example.com	\N	Claudia	Mancini	2024	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
995	123433	laughingllama78@gmail.com	\N	Bettino	Ferraro	2025	\N	\N	\N	\N	t	2026-06-03 15:33:52.462056	student
994	748292	stefano.rivalta@example.com	\N	Stefano	Rivalta	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
582	101367	alberto.vico@example.com	\N	Alberto	Vico	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
639	101301	adriano.belli@example.com	\N	Adriano	Belli	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
661	101279	alberto.valenti@example.com	\N	Alberto	Valenti	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
727	101211	alberto.serra@example.com	\N	Alberto	Serra	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
748	101187	adriana.marino@example.com	\N	Adriana	Marino	2021	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
880	101053	nora.costa@example.com	\N	Nora	Costa	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
774	101161	amedeo.fonti@example.com	\N	Amedeo	Fonti	2022	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
889	101044	alba.neri@example.com	\N	Alba	Neri	2023	\N	\N	\N	\N	t	2026-06-03 14:56:59.47382	student
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgres
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 9, true);


--
-- Name: preference_collection_intervals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.preference_collection_intervals_id_seq', 44, true);


--
-- Name: sites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sites_id_seq', 334, true);


--
-- Name: structures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.structures_id_seq', 187, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 999, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_student_id_structure_id_collection_id_month_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_student_id_structure_id_collection_id_month_pk PRIMARY KEY (student_id, structure_id, collection_id, month);


--
-- Name: capacities capacities_structure_id_year_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capacities
    ADD CONSTRAINT capacities_structure_id_year_pk PRIMARY KEY (structure_id, year);


--
-- Name: preference_collection_intervals preference_collection_intervals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preference_collection_intervals
    ADD CONSTRAINT preference_collection_intervals_pkey PRIMARY KEY (id);


--
-- Name: preferences preferences_student_id_collection_id_site_id_month_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferences
    ADD CONSTRAINT preferences_student_id_collection_id_site_id_month_pk PRIMARY KEY (student_id, collection_id, site_id, month);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: sites sites_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_name_unique UNIQUE (name);


--
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (id);


--
-- Name: structures structures_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structures
    ADD CONSTRAINT structures_name_unique UNIQUE (name);


--
-- Name: structures structures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structures
    ADD CONSTRAINT structures_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_number_unique UNIQUE (number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: email_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX email_index ON public.users USING btree (email);


--
-- Name: mfa_secret; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX mfa_secret ON public.users USING btree (mfa_secret);


--
-- Name: number_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX number_index ON public.users USING btree (number);


--
-- Name: site_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX site_name ON public.sites USING btree (name);


--
-- Name: structure_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX structure_name ON public.structures USING btree (name);


--
-- Name: assignments assignments_collection_id_preference_collection_intervals_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_collection_id_preference_collection_intervals_id_fk FOREIGN KEY (collection_id) REFERENCES public.preference_collection_intervals(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_structure_id_structures_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_structure_id_structures_id_fk FOREIGN KEY (structure_id) REFERENCES public.structures(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_student_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_student_id_users_id_fk FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: capacities capacities_structure_id_structures_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capacities
    ADD CONSTRAINT capacities_structure_id_structures_id_fk FOREIGN KEY (structure_id) REFERENCES public.structures(id) ON DELETE CASCADE;


--
-- Name: preferences preferences_collection_id_preference_collection_intervals_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferences
    ADD CONSTRAINT preferences_collection_id_preference_collection_intervals_id_fk FOREIGN KEY (collection_id) REFERENCES public.preference_collection_intervals(id) ON DELETE CASCADE;


--
-- Name: preferences preferences_site_id_sites_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferences
    ADD CONSTRAINT preferences_site_id_sites_id_fk FOREIGN KEY (site_id) REFERENCES public.sites(id);


--
-- Name: preferences preferences_student_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferences
    ADD CONSTRAINT preferences_student_id_users_id_fk FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: structures structures_site_id_sites_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structures
    ADD CONSTRAINT structures_site_id_sites_id_fk FOREIGN KEY (site_id) REFERENCES public.sites(id);


--
-- PostgreSQL database dump complete
--

\unrestrict xRG9ga2gkLAYvV97zFKno3Vn7pBVbqATeogcDGHastwegy0Tcf2eqvHdzTiHhrE

