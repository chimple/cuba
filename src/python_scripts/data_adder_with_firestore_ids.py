import firebase_admin
from firebase_admin import credentials, firestore
from supabase import create_client, Client
import unicodedata
from datetime import datetime
import time
import json

# Helper Functions
def get_subject_id(doc_data, supabase):
    def normalize(text):
        return unicodedata.normalize('NFC', text.strip()) if text else ''
    title = normalize(get_the_doc(doc_data.get("subject")).get("title"))
    response = supabase.table("subject").select("id").eq("name", title).execute()
    if response.data:
        return response.data[0]["id"]
    return None

def get_grade_id(doc_data, supabase):
    def normalize(text):
        return unicodedata.normalize('NFC', text.strip()) if text else ''
    title = normalize(get_the_doc(doc_data.get("grade")).get("title"))
    response = supabase.table("grade").select("id").eq("name", title).execute()
    if response.data:
        return response.data[0]["id"]
    return None

def get_curriculum_id(doc_data, supabase):
    def normalize(text):
        return unicodedata.normalize('NFC', text.strip()) if text else ''
    title = normalize(get_the_doc(doc_data.get("curriculum")).get("title"))
    response = supabase.table("curriculum").select("id").eq("name", title).execute()
    if response.data:
        return response.data[0]["id"]
    return None

def get_language_id(doc_data, supabase):
    def normalize(text):
        return unicodedata.normalize('NFC', text.strip()) if text else ''
    title = normalize(get_the_doc(doc_data.get("language")).get("title"))
    response = supabase.table("language").select("id").eq("name", title).execute()
    if response.data:
        return response.data[0]["id"]
    return None

def get_the_doc(ref):
    if isinstance(ref, firestore.DocumentReference):
        doc = ref.get()
        if doc.exists:
            val = doc.to_dict()
            return val
        
def normalize_datetimes(data):
    for key, value in data.items():
        if isinstance(value, datetime):
            data[key] = value.isoformat()
    return data

def run_timer():
    print("**Timer Started**")
    time.sleep(180)
    print("**Adding Document..**")

def fetch_documents_by_id_one_by_one(doc_ids):
    for doc_id in doc_ids:
        doc_ref = docs.document(doc_id)
        doc = doc_ref.get()
        if doc.exists:
            yield doc.to_dict()
        else:
            print(f"Document with ID {doc_id} not found.")
        run_timer()

def get_the_doc(ref):
    if isinstance(ref, firestore.DocumentReference):
        doc = ref.get()
        if doc.exists:
            val = doc.to_dict()
            return val

# Firebase setup
FIREBASE_CREDENTIALS_PATH = "serviceAccountKey.json"  
firebase_admin.initialize_app(credentials.Certificate(FIREBASE_CREDENTIALS_PATH))
db = firestore.client()
if db:
    print("**Firebase connected successfully.**")

# Supabase setup
SUPABASE_URL, SUPABASE_KEY = (lambda c: (c['S_URL'], c['S_KEY']))(json.load(open('serviceAccountKeySupabase.json')))
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
if supabase:
    print("**Supabase connected successfully.**")

print("**--------------------------------**")

# List of document IDs you want to fetch from firestore
document_ids = ['*', '*', '*']

# Firebase table
collection_name = "Course"
docs = db.collection(collection_name)
        
# Usage
for doc_data in fetch_documents_by_id_one_by_one(document_ids):
    insert_data = {
        "name": doc_data['title'],
        "image": doc_data.get("thumbnail","null"),
        "description": "",
        "sort_index": doc_data.get('sortIndex', 256),
        "subject_id": get_subject_id(doc_data, supabase),
        "grade_id": get_grade_id(doc_data, supabase),
        "curriculum_id": get_curriculum_id(doc_data, supabase),
        "is_deleted": False,
        "color": doc_data.get("color","null"),
        "code": doc_data['courseCode']
    }
    response = supabase.table("course").insert(insert_data).execute()
    if response:
        print(f"✅ Inserted in course: {response}")
        course_id = response.data[0]['id']
        chapter = doc_data['chapters']
        for idx, ch_data in enumerate(chapter):
            chapter_resp = {
                "name": ch_data['title'],
                "image": ch_data.get("thumbnail","null"),
                "course_id": course_id,
                "sort_index": idx,
                "sub_topics": "",
                "is_deleted": False
            }
            cr = supabase.table("chapter").insert(chapter_resp).execute()
            print(f"✅ Inserted in chapter: {cr}")
            chapter_id = cr.data[0]['id']
            for idx, lesson_doc in enumerate(ch_data['lessons']):
                ln_data = lesson_doc.get().to_dict()
                lesson_resp = {
                    "name": ln_data['title'],
                    "image": ln_data.get("thumbnail","null"),
                    "outcome": ln_data.get("outcome","null"),
                    "plugin_type": ln_data['pluginType'],
                    "status": ln_data['status'],
                    "cocos_subject_code": ln_data['cocosSubjectCode'],
                    "cocos_chapter_code": ln_data['cocosChapterCode'],
                    "subject_id": get_subject_id(ln_data, supabase),
                    "target_age_from": ln_data['targetAgeFrom'],
                    "target_age_to": ln_data['targetAgeTo'],
                    "language_id": get_language_id(ln_data, supabase),
                    "is_deleted": False,
                    "cocos_lesson_id": ln_data['id'],
                    "color": "",
                }
                lesson_resp = normalize_datetimes(lesson_resp)
                lr = supabase.table("lesson").insert(lesson_resp).execute()
                print(f"✅ Inserted in lesson: {lr}")
                lesson_id = lr.data[0]['id']
                cl = supabase.table("chapter_lesson").insert({ 
                    "lesson_id": lesson_id,
                    "chapter_id": chapter_id,
                    "sort_index": idx,
                    "is_deleted": False,
                }).execute()
                print(f"✅ Inserted in chapter_lesson: {cl}")
                time.sleep(5)