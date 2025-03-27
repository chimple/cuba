import firebase_admin
from firebase_admin import credentials, firestore
from supabase import create_client, Client
import json

firebase_list = []
supabase_list = []

# Firebase setup
FIREBASE_CREDENTIALS_PATH = "serviceAccountKey.json"  # Replace with your Firebase credentials
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

# Firebase table
collection_name = "Curriculum"
firebase_docs = db.collection(collection_name).stream()
data_list = []
for doc in firebase_docs:
    doc_data = doc.to_dict()
    doc_data["id"] = doc.id 
    data_list.append(doc_data)
if data_list:
    for data in data_list:
        firebase_list.append(data['title'])

# Supabase table
print()
response = supabase.table("curriculum").select("*").execute()
for i in response.data:
    supabase_list.append(i['name'])

matches = [word for word in firebase_list if any(word in item for item in supabase_list)]
non_matches = [word for word in firebase_list if word not in matches]
print("Existed vales from tables:",matches)
print("Non-Existed vales from tables:",non_matches)

#Inserting into supabase table
for name in non_matches:
    response = supabase.table("curriculum").insert({"name": name}).execute()
    print(f"Inserted: {name}, Response: {response}")
