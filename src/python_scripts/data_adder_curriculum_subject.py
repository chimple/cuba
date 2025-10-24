import firebase_admin
from firebase_admin import credentials, firestore
from supabase import create_client, Client
import json

firebase_list = []
supabase_list = []

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

cm = "Curriculum"
st = "Subject"
input_val = input(f"Choose {cm} or {st} to add, type curr for Curriculum or sub for Subject: ")
chosen = ""
if input_val == "curr":
    chosen = cm
elif input_val == "sub":
    chosen = st
else:
    print("None")

# Firebase table
collection_name = chosen
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
response = supabase.table(chosen.lower()).select("*").execute()
for i in response.data:
    supabase_list.append(i['name'])

matches = [word for word in firebase_list if any(word in item for item in supabase_list)]
non_matches = [word for word in firebase_list if word not in matches]
print("Existed vales from tables:",matches)
print("Non-Existed vales from tables:",non_matches)

#Inserting into supabase table
for value in non_matches:
    response = supabase.table(chosen.lower()).insert({"name": value}).execute()
    print(f"Inserted: {value}, Response: {response}")
