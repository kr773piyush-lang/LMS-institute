# Institute LMS Backend Documentation

## Overview
FastAPI-based Learning Management System backend with multi-tenant support, role-based access control, and comprehensive course/content management.

---

## 1. API ENDPOINTS

### Authentication Endpoints (`/auth`)

#### POST `/auth/register`
- **Description**: Register a new student user
- **Request Body** (LoginRequest):
  - `first_name`: str
  - `last_name`: str
  - `email`: EmailStr
  - `mob_no`: str
  - `password`: str (min_length=8)
  - `course_id`: str
  - `subcourse_id`: str
- **Response**: UserRead
- **Status**: 201
- **Validation**: Email must be unique; course and subcourse must exist in default institute
- **Default Institute**: Uses system settings' default_institute_id

#### POST `/auth/login`
- **Description**: Authenticate user and get access token
- **Request Body** (LoginRequest):
  - `email`: str
  - `password`: str
- **Response** (TokenResponse):
  - `access_token`: str (JWT)
  - `token_type`: str = "bearer"
- **Status**: 200
- **Validation**: User must be approved; password must match hash
- **Side Effect**: Updates user's last_login timestamp

---

### Users Endpoints (`/users`)

#### GET `/users`
- **Description**: List all users or users for specific institute
- **Query Params**:
  - `institute_id`: str (optional)
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Response**: list[UserRead]
- **Behavior**: 
  - super_admin can see all users
  - institute_admin sees only users in their institute

#### GET `/users?institute_id={institute_id}`
- **Description**: List users for specific institute
- **Query Params**:
  - `institute_id`: str
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Response**: list[UserRead]

#### POST `/users`
- **Description**: Create a new user
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Request Body** (UserCreateRequest):
  - `first_name`: str
  - `last_name`: str
  - `email`: EmailStr
  - `mob_no`: str
  - `password`: str
  - `is_approved`: bool = False
  - `active`: bool = True
  - `institute_id`: str | None (super_admin only)
  - `role_names`: list[str] = ["student"]
- **Response**: UserRead
- **Status**: 201
- **Validation**: 
  - Email must be unique
  - Institute must exist (if specified)
  - Default to tenant's institute if not specified
- **Side Effect**: Creates auth record, assigns roles, creates UserRole entries

#### PUT `/users/{user_id}/approve`
- **Description**: Approve or reject a user
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Request Body** (UserApproveRequest):
  - `approve`: bool = True
- **Response**: UserRead
- **Status**: 200
- **Behavior**: 
  - On approval: automatically enrolls user in selected courses/modules
  - Deletes UserSelectedCourse records after approval

#### PUT `/users/{user_id}/assign-institute`
- **Description**: Assign user to an institute
- **Dependencies**: require_roles("super_admin")
- **Request Body** (AssignInstituteRequest):
  - `institute_id`: str
- **Response**: UserRead
- **Status**: 200

#### POST `/users/{user_id}/roles`
- **Description**: Assign roles to a user
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Request Body** (AssignRolesRequest):
  - `role_names`: list[str]
- **Response**: MessageResponse
- **Status**: 201
- **Behavior**: Creates new roles if they don't exist, assigns to user

---

### Institutes Endpoints (`/institutes`)

#### POST `/institutes`
- **Description**: Create a new institute
- **Dependencies**: require_roles("super_admin")
- **Request Body** (InstituteCreate):
  - `name`: str
  - `email`: EmailStr
  - `mob_no`: str
  - `country`: str
  - `state`: str
  - `place`: str
  - `pincode`: str
  - `active`: bool = True
  - `institute_id`: str | None
  - `admin_first_name`: str = "Institute"
  - `admin_last_name`: str = "Admin"
  - `admin_password`: str (min_length=8)
- **Response**: InstituteRead
- **Status**: 201

#### GET `/institutes`
- **Description**: List all institutes
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Response**: list[InstituteRead]
- **Status**: 200
- **Behavior**: super_admin sees all; institute_admin sees their own

#### PUT `/institutes/{institute_id}`
- **Description**: Update institute information
- **Dependencies**: require_roles("super_admin")
- **Request Body** (InstituteUpdate):
  - `name`: str
  - `email`: EmailStr
  - `mob_no`: str
  - `country`: str
  - `state`: str
  - `place`: str
  - `pincode`: str
  - `active`: bool
  - `admin_first_name`: str | None
  - `admin_last_name`: str | None
  - `admin_password`: str | None (min_length=8)
- **Response**: InstituteRead
- **Status**: 200

#### DELETE `/institutes/{institute_id}`
- **Description**: Delete an institute
- **Dependencies**: require_roles("super_admin")
- **Response**: MessageResponse
- **Status**: 200
- **Side Effect**: Deactivates institute (soft delete)

---

### Courses Endpoints (`/courses`)

#### POST `/courses`
- **Description**: Create a new course
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Request Body** (CourseCreate):
  - `course_name`: str
  - `course_id`: str | None
  - `institute_id`: str | None
  - `active`: bool = True
- **Response**: CourseRead
- **Status**: 201
- **Validation**: Teachers cannot create top-level courses
- **Unique Constraint**: institute_id + course_name

#### GET `/courses`
- **Description**: List courses for current institute
- **Dependencies**: require_roles("super_admin", "institute_admin", "teacher", "student")
- **Query Params**:
  - `institute_id`: str | None
- **Response**: list[CourseRead]
- **Status**: 200
- **Behavior**:
  - super_admin/institute_admin: see all courses
  - teacher: see courses they teach
  - student: see courses they're enrolled in

#### POST `/subcourses`
- **Description**: Create a subcourse
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Request Body** (SubCourseCreate):
  - `course_id`: str
  - `subcourse_name`: str
  - `subcourse_id`: str | None
  - `institute_id`: str | None
  - `active`: bool = True
- **Response**: SubCourseRead
- **Status**: 201
- **Validation**: Teachers cannot create subcourses
- **Unique Constraint**: course_id + subcourse_name

#### GET `/subcourses`
- **Description**: List subcourses
- **Dependencies**: require_roles("super_admin", "institute_admin", "teacher", "student")
- **Query Params**:
  - `institute_id`: str | None
  - `course_id`: str | None
- **Response**: list[SubCourseRead]
- **Status**: 200

#### POST `/modules`
- **Description**: Create a module
- **Dependencies**: require_roles("super_admin", "institute_admin", "teacher")
- **Request Body** (ModuleCreate):
  - `course_id`: str
  - `subcourse_id`: str
  - `module_name`: str
  - `module_id`: str | None
  - `institute_id`: str | None
  - `active`: bool = True
- **Response**: ModuleRead
- **Status**: 201
- **Validation**: Teachers must have batch assignment for course/subcourse
- **Unique Constraint**: subcourse_id + module_name

#### GET `/modules`
- **Description**: List modules
- **Dependencies**: require_roles("super_admin", "institute_admin", "teacher", "student")
- **Query Params**:
  - `institute_id`: str | None
  - `course_id`: str | None
  - `subcourse_id`: str | None
- **Response**: list[ModuleRead]
- **Status**: 200

---

### Content Endpoints (`/content`)

#### POST `/content`
- **Description**: Create content item (with file upload)
- **Dependencies**: require_roles("super_admin", "institute_admin", "teacher")
- **Request Body** (form-data):
  - `module_id`: str (required)
  - `type`: ContentType (required) - "text"|"video"|"audio"|"pdf"|"document"|"quiz"
  - `title`: str (required, 1-255 chars)
  - `description`: str | None
  - `external_url`: str | None
  - `order_index`: int = 0 (>=0)
  - `category`: str = "reading"
  - `instructions`: str | None
  - `downloadable`: bool = False
  - `response_type`: str | None
  - `duration`: int = 0 (>=0)
  - `institute_id`: str | None
  - `file`: UploadFile | None
- **Response**: ContentRead
- **Status**: 201
- **File Upload**: Uploads to Cloudinary if configured
- **Validation Rules**:
  - Text/Quiz: cannot have file_url, must have description or external_url
  - Video/Audio/PDF/Document: require file_url or external_url
  - Teachers only: can add content to their assigned batch modules

#### GET `/modules/{module_id}/contents`
- **Description**: List content in a module
- **Dependencies**: require_roles("super_admin", "institute_admin", "teacher", "student")
- **Response**: list[ContentRead]
- **Status**: 200
- **Ordered By**: order_index, created_at, content_id

#### PUT `/content/{content_id}`
- **Description**: Update content item
- **Dependencies**: require_roles("super_admin", "institute_admin", "teacher")
- **Request Body** (ContentUpdate):
  - `title`: str | None (1-255 chars)
  - `type`: ContentType | None
  - `description`: str | None
  - `external_url`: str | None
  - `order_index`: int | None (>=0)
  - `category`: str | None
  - `instructions`: str | None
  - `downloadable`: bool | None
  - `response_type`: str | None
  - `duration`: int | None (>=0)
  - `institute_id`: str | None
  - `replace_file`: bool = False
- **Response**: ContentRead
- **Status**: 200
- **Permissions**: Teachers can only edit their own content

#### DELETE `/content/{content_id}`
- **Description**: Delete content item
- **Dependencies**: require_roles("super_admin", "institute_admin", "teacher")
- **Response**: ContentDeleteResponse
- **Status**: 200
- **Side Effect**: Deletes file from storage

#### OPTIONS `/content`, `/content/{content_id}`
- **Description**: CORS preflight
- **Status**: 204

---

### Batches Endpoints (`/batches`)

#### POST `/batches`
- **Description**: Create a batch
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Request Body** (BatchCreate):
  - `course_id`: str
  - `subcourse_id`: str
  - `batch_name`: str
  - `description`: str | None
  - `room_name`: str | None
  - `schedule_notes`: str | None
  - `start_date`: str | None
  - `end_date`: str | None
  - `batch_id`: str | None
  - `institute_id`: str | None
  - `active`: bool = True
- **Response**: BatchRead
- **Status**: 201
- **Unique Constraint**: institute_id + batch_name

#### GET `/batches`
- **Description**: List batches
- **Dependencies**: require_roles("super_admin", "institute_admin", "teacher", "student")
- **Query Params**:
  - `institute_id`: str | None
- **Response**: list[BatchRead]
- **Status**: 200
- **Behavior**:
  - teacher: see batches they teach
  - student: see batches they're assigned to

#### PUT `/batches/{batch_id}`
- **Description**: Update batch
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Request Body** (BatchUpdate): (same as Create)
- **Response**: BatchRead
- **Status**: 200

#### DELETE `/batches/{batch_id}`
- **Description**: Delete batch
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Response**: MessageResponse
- **Status**: 200
- **Side Effect**: Soft delete (sets active=false)

#### GET `/batches/{batch_id}/details`
- **Description**: Get batch details with students and teachers
- **Dependencies**: require_roles("super_admin", "institute_admin", "teacher", "student")
- **Response**: dict
- **Status**: 200

#### POST `/assign-teacher`
- **Description**: Assign teacher to batch
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Request Body** (AssignTeacherRequest):
  - `batch_id`: str
  - `user_id`: str
  - `institute_id`: str | None
- **Response**: BatchTeacherRead
- **Status**: 201
- **Unique Constraint**: batch_id + user_id

---

### Enrollment Endpoints (`/enroll`)

#### POST `/enroll`
- **Description**: Enroll user in course/subcourse
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Request Body** (EnrollUserRequest):
  - `user_id`: str
  - `course_id`: str
  - `subcourse_id`: str
  - `institute_id`: str | None
- **Response**: UserCourseRead
- **Status**: 201
- **Side Effect**: Automatically creates UserModule entries for all subcourse modules
- **Unique Constraint**: user_id + course_id + subcourse_id

#### POST `/assign-batch`
- **Description**: Assign user to batch
- **Dependencies**: require_roles("super_admin", "institute_admin")
- **Request Body** (AssignBatchRequest):
  - `user_id`: str
  - `batch_id`: str
  - `institute_id`: str | None
- **Response**: UserBatchRead
- **Status**: 201
- **Unique Constraint**: user_id + batch_id

---

### Progress Endpoints (`/progress`)

#### POST `/progress/mark-complete`
- **Description**: Mark module as complete
- **Dependencies**: require_roles (all authenticated users)
- **Request Body** (MarkModuleCompleteRequest):
  - `module_id`: str
  - `completed`: bool = True
  - `progress_percent`: float = 100.0 (0-100)
- **Response**: UserProgressRead
- **Status**: 201
- **Validation**: User must be enrolled in module
- **Side Effect**: Creates or updates UserProgress record

#### GET `/progress/me`
- **Description**: Get current user's progress
- **Dependencies**: require_roles (all authenticated users)
- **Response**: list[UserProgressRead]
- **Status**: 200

---

### Students Endpoints (`/students`)

#### GET `/students/enrolled-courses`
- **Description**: Get student's enrolled courses
- **Dependencies**: require_roles (current user)
- **Response**: list[dict]
- **Status**: 200
- **Fields per course**:
  - `course_id`: str
  - `course_name`: str
  - `subcourse_id`: str
  - `subcourse_name`: str

#### GET `/students/modules-content`
- **Description**: Get student's modules with content
- **Dependencies**: require_roles (current user)
- **Response**: list[dict]
- **Status**: 200
- **Fields per module**:
  - `module_id`: str
  - `module_name`: str
  - `content`: list[ContentRead]

#### GET `/students/batches`
- **Description**: Get student's batches
- **Dependencies**: require_roles (current user)
- **Response**: list[dict]
- **Status**: 200
- **Fields per batch**:
  - `batch_id`, `batch_name`, `course_id`, `course_name`
  - `subcourse_id`, `subcourse_name`
  - `description`, `room_name`, `schedule_notes`, `start_date`, `end_date`

#### GET `/students/course-workspace/{course_id}`
- **Description**: Get student's course workspace with modules and content
- **Dependencies**: require_roles (current user)
- **Query Params**:
  - `category`: str | None
- **Response**: dict
- **Status**: 200
- **Fields**:
  - `course_id`: str
  - `batches`: list[dict]
  - `modules`: list[dict]
  - `content_categories`: list[str]
  - `content`: list[ContentRead]

#### POST `/students/content-submissions`
- **Description**: Submit content response
- **Dependencies**: require_roles (current user)
- **Request Body** (StudentSubmissionRequest):
  - `content_id`: str
  - `response_type`: str
  - `response_text`: str | None
  - `response_url`: str | None
- **Response**: dict
- **Status**: 201
- **Validation**: At least one of response_text or response_url required

---

### Health Check

#### GET `/health`
- **Description**: Health check endpoint
- **Response**: {"status": "ok"}
- **Status**: 200

---

## 2. DATABASE MODELS

### User
```
- user_id: str (UUID, PK)
- institute_id: str (FK -> Institute)
- first_name: str
- last_name: str
- email: str (unique)
- mob_no: str (20 chars)
- is_approved: bool (default: False)
- active: bool (default: True)
- created_at: datetime (TimestampMixin)
- updated_at: datetime (TimestampMixin)

Relationships:
- institute: Institute (back_populates="users")
- auth: Auth (uselist=False, cascade delete)
- roles: list[UserRole] (cascade delete)
```

### Auth
```
- user_id: str (UUID, PK, FK -> User)
- password_hash: str
- last_login: datetime | None

Methods:
- mark_login(): Updates last_login to UTC.now()

Relationships:
- user: User (back_populates="auth")
```

### Institute
```
- institute_id: str (UUID, PK)
- name: str
- email: str (unique)
- mob_no: str
- country: str
- state: str
- place: str
- pincode: str
- active: bool (default: True)
- created_at: datetime (TimestampMixin)
- updated_at: datetime (TimestampMixin)

Relationships:
- users: list[User]
- courses: list[Course]
```

### Course
```
- course_id: str (UUID, PK)
- institute_id: str (FK -> Institute, indexed)
- course_name: str
- active: bool (default: True)

Unique Constraint: (institute_id, course_name)

Relationships:
- institute: Institute
- subcourses: list[SubCourse] (cascade delete)
```

### SubCourse
```
- subcourse_id: str (UUID, PK)
- course_id: str (FK -> Course)
- institute_id: str (FK -> Institute, indexed)
- subcourse_name: str
- active: bool (default: True)

Unique Constraint: (course_id, subcourse_name)

Relationships:
- course: Course
- modules: list[Module] (cascade delete)
```

### Module
```
- module_id: str (UUID, PK)
- course_id: str (FK -> Course)
- subcourse_id: str (FK -> SubCourse)
- institute_id: str (FK -> Institute, indexed)
- module_name: str
- active: bool (default: True)

Unique Constraint: (subcourse_id, module_name)

Relationships:
- subcourse: SubCourse
- contents: list[Content] (cascade delete)
```

### Content
```
- content_id: str (UUID, PK)
- institute_id: str (FK -> Institute, indexed)
- module_id: str (FK -> Module)
- created_by: str | None (FK -> User)
- title: str
- type: str ("text", "video", "audio", "pdf", "document", "quiz")
- description: str | None
- file_url: str | None
- external_url: str | None
- storage_key: str | None
- order_index: int (default: 0)
- url: str | None
- duration: int (default: 0, in minutes)
- created_at: datetime (TimestampMixin)
- updated_at: datetime (TimestampMixin)

Properties:
- category: str (from profile or type)
- body_text: str | None
- instructions: str | None
- downloadable: bool
- response_type: str | None
- resolved_url: str | None (file_url or external_url or url)

Relationships:
- module: Module
- profile: ContentProfile (uselist=False, cascade delete)
- creator: User (ForeignKey)
```

### ContentProfile
```
- content_id: str (UUID, PK, FK -> Content)
- category: str (default: "reading")
- body_text: str | None
- instructions: str | None
- downloadable: bool (default: False)
- response_type: str | None ("text", "url", etc.)

Relationships:
- content: Content
```

### Batch
```
- batch_id: str (UUID, PK)
- institute_id: str (FK -> Institute, indexed)
- course_id: str (FK -> Course)
- subcourse_id: str (FK -> SubCourse)
- batch_name: str
- active: bool (default: True)

Unique Constraint: (institute_id, batch_name)

Relationships:
- detail: BatchDetail (uselist=False, cascade delete)
```

### BatchDetail
```
- batch_id: str (UUID, PK, FK -> Batch)
- description: str | None
- room_name: str | None
- schedule_notes: str | None
- start_date: str | None
- end_date: str | None

Relationships:
- batch: Batch
```

### UserRole
```
- id: str (UUID, PK)
- user_id: str (FK -> User)
- role_id: str (FK -> Role)

Unique Constraint: (user_id, role_id)

Relationships:
- user: User
- role: Role
```

### Role
```
- role_id: str (UUID, PK)
- role_name: str (unique)
- active: bool (default: True)

Default Roles: ["super_admin", "institute_admin", "teacher", "student"]

Relationships:
- user_roles: list[UserRole]
```

### UserCourse
```
- id: str (UUID, PK)
- institute_id: str (FK -> Institute, indexed)
- user_id: str (FK -> User)
- course_id: str (FK -> Course)
- subcourse_id: str (FK -> SubCourse)

Unique Constraint: (user_id, course_id, subcourse_id)
```

### UserModule
```
- user_module_id: str (UUID, PK)
- institute_id: str (FK -> Institute, indexed)
- user_id: str (FK -> User)
- module_id: str (FK -> Module)
- active: bool (default: True)

Unique Constraint: (user_id, module_id)
```

### UserBatch
```
- user_batch_id: str (UUID, PK)
- institute_id: str (FK -> Institute, indexed)
- user_id: str (FK -> User)
- batch_id: str (FK -> Batch)
- active: bool (default: True)

Unique Constraint: (user_id, batch_id)
```

### BatchTeacher
```
- id: str (UUID, PK)
- institute_id: str (FK -> Institute, indexed)
- batch_id: str (FK -> Batch)
- user_id: str (FK -> User)

Unique Constraint: (batch_id, user_id)
```

### UserProgress
```
- id: str (UUID, PK)
- institute_id: str (FK -> Institute, indexed)
- user_id: str (FK -> User)
- module_id: str (FK -> Module)
- completed: bool (default: False)
- progress_percent: float (default: 0.0)
- last_accessed: datetime (default: UTC.now())

Unique Constraint: (user_id, module_id)
```

### StudentSubmission
```
- submission_id: str (UUID, PK)
- institute_id: str (FK -> Institute, indexed)
- content_id: str (FK -> Content)
- user_id: str (FK -> User)
- response_type: str
- response_text: str | None
- response_url: str | None
- submitted_at: datetime (default: UTC.utcnow())
```

### UserSelectedCourse
```
- id: str (UUID, PK)
- user_id: str (FK -> User)
- course_id: str (FK -> Course)
- subcourse_id: str (FK -> SubCourse)
- created_at: datetime (default: UTC.now())

Unique Constraint: (user_id, course_id, subcourse_id)

Note: Temporary storage during user registration. Deleted after user approval.
```

### SystemSetting
```
- id: str (UUID, PK)
- default_institute_id: str | None (FK -> Institute)
- allow_multi_tenant: bool (default: True)

Relationships:
- default_institute: Institute
```

---

## 3. AUTHENTICATION & AUTHORIZATION

### JWT Token Structure
```python
{
    "sub": user_id (UUID string),
    "exp": expiration_time,
    "institute_id": user.institute_id,
    "roles": [role_names]
}
```

### Token Generation
- **Algorithm**: HS256
- **Secret**: jwt_secret_key (from config)
- **Duration**: access_token_expire_minutes (default: 1440 = 24 hours)
- **Function**: `create_access_token(subject, expires_delta, **extra)`

### Token Validation
- **Function**: `decode_token(token)`
- **Returns**: dict[str, Any] | None
- **Errors**: Returns None on JWTError

### Password Hashing
- **Algorithm**: Argon2
- **Functions**: 
  - `get_password_hash(password)` -> str
  - `verify_password(plain_password, hashed_password)` -> bool

### Authentication Dependency
```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def get_current_user(token, db) -> User:
    # Validates token and returns authenticated user
    # Raises HTTP_401_UNAUTHORIZED if invalid
    
def get_current_user_optional(token, db) -> User | None:
    # Optional authentication, returns None if not authenticated
```

### Authorization: Role-Based Access Control

#### Default Roles
1. **super_admin**: Full system access
2. **institute_admin**: Institute-level admin access
3. **teacher**: Can teach batches, create/manage content
4. **student**: Can access enrolled courses/modules

#### Role Guard Function
```python
def require_roles(*allowed_roles) -> Depends:
    # Checks if current_user has any of the allowed_roles
    # Raises HTTP_403_FORBIDDEN if no matching role
```

#### Role Assignments
- Users are assigned roles through UserRole junction table
- Roles are created on-demand during user creation
- Multiple roles can be assigned to a single user

---

## 4. AUTHORIZATION & BUSINESS LOGIC

### Multi-Tenancy

#### TenantContext
```python
@dataclass
class TenantContext:
    institute_id: str
    allow_multi_tenant: bool
```

#### Resolution
- **Single-tenant mode** (allow_multi_tenant=False):
  - Uses system settings' default_institute_id
- **Multi-tenant mode** (allow_multi_tenant=True):
  - Uses current_user.institute_id

#### Institute Scope Resolution
```python
def resolve_institute_scope(db, current_user, tenant, requested_institute_id):
    # Validates scope based on user role and multi-tenancy setting
    # super_admin can access any institute in multi-tenant mode
    # Others can only access their own institute
```

### User Management Rules

1. **Registration**:
   - Email must be unique
   - Password minimum 8 characters
   - Auto-assigned to default institute
   - Auto-assigned "student" role
   - Requires course/subcourse selection
   - Initially not approved (is_approved=False)

2. **User Approval**:
   - Admin must approve before user can login (requires is_approved=True)
   - On approval:
     - Converts UserSelectedCourse → UserCourse
     - Creates UserModule entries for all modules in subcourse
     - Deletes UserSelectedCourse records

3. **User Creation (Admin)**:
   - Can specify institute (super_admin only)
   - Can specify roles (default: ["student"])
   - Can set initial approval status
   - Creates Auth record with password hash

4. **Institute Scope**:
   - institute_admin: can only access their institute
   - super_admin: can access any institute (multi-tenant mode)

### Course & Content Management

1. **Course Hierarchy**:
   - Institute → Course → SubCourse → Module → Content
   - Unique constraints at each level

2. **Teacher Scope**:
   - Teachers can only manage content for courses in their assigned batches
   - Teachers cannot create top-level courses/subcourses
   - Teachers can only edit content they created
   - If super_admin or institute_admin, teachers have full access

3. **Student Scope**:
   - Students can only see courses they're enrolled in
   - Students can only see modules in their enrolled subcourses
   - Students can only submit content they have access to

### Batch Management

1. **Batch Creation**:
   - Links course/subcourse to a batch
   - Optional: description, room_name, schedule_notes, start_date, end_date
   - Unique: institute_id + batch_name

2. **Teacher Assignment**:
   - Teachers assigned to batches via BatchTeacher
   - Teachers gain scope to manage content for batch's course/subcourse

3. **Student Assignment**:
   - Students assigned via UserBatch (active flag)
   - Determines which batches student sees

### Enrollment & Progress

1. **Course Enrollment (UserCourse)**:
   - Requires course + subcourse
   - Auto-creates UserModule for each module in subcourse
   - Unique: user_id + course_id + subcourse_id

2. **Module Progress (UserProgress)**:
   - Tracks completed status and progress_percent
   - Can only mark progress for enrolled modules
   - Unique: user_id + module_id
   - Supports upsert (create or update)

3. **Content Submissions (StudentSubmission)**:
   - Records student responses to content
   - response_type: "text" or "url"
   - Tracks submitted_at timestamp

### Content Validation Rules

1. **Type-Specific Rules**:
   - **Text**: No file_url; requires description or external_url
   - **Quiz**: No file_url; requires description or external_url
   - **Video/Audio/PDF/Document**: Requires file_url or external_url

2. **File Upload**:
   - Cloudinary integration (if configured)
   - Storage key naming convention
   - Supports file replacement via replace_file flag

3. **Content Properties**:
   - order_index: Controls display order (>=0)
   - category: "reading", "assignment", etc.
   - downloadable: Whether students can download
   - response_type: "text", "url", etc.
   - duration: In minutes (>=0)

### System Bootstrap

On application startup:
1. Creates default institute if none exists
2. Creates default roles: super_admin, institute_admin, teacher, student
3. Creates default super admin user
4. Initializes system settings

Default admin:
- Email: admin@gmail.com (configurable)
- Password: Admin123 (configurable)
- Always approved and active
- Auto-assigned super_admin role

---

## 5. CRUD OPERATIONS

### User CRUD
- `create_user(db, user)` → User
- `create_auth(db, auth)` → Auth
- `get_user_by_email(db, email)` → User | None
- `get_user_by_id(db, user_id)` → User | None (with relations)
- `get_all_users(db)` → list[User]
- `get_users_by_institute(db, institute_id, include_inactive)` → list[User]
- `set_user_approval(db, user, approved)` → User
- `assign_user_role(db, user_role)` → UserRole
- `deactivate_user(db, user)` → None

### Course CRUD
- `create_course(db, course)` → Course
- `create_subcourse(db, subcourse)` → SubCourse
- `create_module(db, module)` → Module
- `create_content(db, content)` → Content
- `create_content_profile(db, profile)` → ContentProfile
- `get_course(db, course_id, institute_id, include_inactive)` → Course | None
- `get_subcourse(db, subcourse_id, institute_id, include_inactive)` → SubCourse | None
- `get_module(db, module_id, institute_id, include_inactive)` → Module | None
- `list_courses(db, institute_id, include_inactive)` → list[Course]
- `list_subcourses(db, institute_id, course_id, include_inactive)` → list[SubCourse]
- `list_modules(db, institute_id, course_id, subcourse_id, include_inactive)` → list[Module]
- `list_user_module_content(db, module_ids, institute_id)` → list[Content]
- `list_modules_by_subcourse(db, subcourse_id, institute_id)` → list[Module]
- `deactivate_course(db, course)` → None
- `deactivate_subcourse(db, subcourse)` → None

### Batch CRUD
- `create_batch(db, batch)` → Batch
- `create_batch_detail(db, detail)` → BatchDetail
- `create_user_batch(db, user_batch)` → UserBatch
- `create_batch_teacher(db, batch_teacher)` → BatchTeacher
- `get_batch(db, batch_id, institute_id)` → Batch | None
- `list_batches(db, institute_id)` → list[Batch]
- `list_batch_teachers_for_user(db, user_id, institute_id)` → list[BatchTeacher]
- `list_user_batches_for_user(db, user_id, institute_id)` → list[UserBatch]
- `list_user_batches_for_batch(db, batch_id, institute_id)` → list[UserBatch]
- `list_batch_teachers_for_batch(db, batch_id, institute_id)` → list[BatchTeacher]
- `deactivate_batch(db, batch)` → None

### Enrollment CRUD
- `create_user_selected_course(db, selected)` → UserSelectedCourse
- `list_user_selected_courses(db, user_id)` → list[UserSelectedCourse]
- `delete_user_selected_courses(db, user_id)` → None
- `create_user_course(db, enrollment)` → UserCourse
- `list_user_courses(db, user_id, institute_id)` → list[UserCourse]
- `create_user_module(db, user_module)` → UserModule
- `list_user_modules(db, user_id, institute_id)` → list[UserModule]

### Progress CRUD
- `get_progress(db, user_id, module_id, institute_id)` → UserProgress | None
- `upsert_progress(db, user_id, module_id, institute_id, completed, percent)` → UserProgress
- `list_progress(db, user_id, institute_id)` → list[UserProgress]

### Role CRUD
- `get_role_by_name(db, role_name)` → Role | None
- `create_role(db, role_name, active)` → Role
- `get_role_names_for_user(db, user_id)` → list[str]

### Institute CRUD
- `create_institute(db, institute)` → Institute
- `get_all_institutes(db, include_inactive)` → list[Institute]
- `get_institute_by_id(db, institute_id, include_inactive)` → Institute | None
- `deactivate_institute(db, institute)` → None

### Auth CRUD
- `update_last_login(db, auth)` → Auth

### System Settings CRUD
- `get_system_settings(db)` → SystemSetting | None
- `create_system_settings(db, default_institute_id, allow_multi_tenant)` → SystemSetting

---

## 6. SERVICES (BUSINESS LOGIC)

### AuthService
- `register_user(db, payload)` → User
  - Validates email uniqueness
  - Creates user with auth record
  - Assigns student role
  - Records selected course for later enrollment

- `login_user(db, payload)` → TokenResponse
  - Validates credentials
  - Checks approval status
  - Updates last_login
  - Returns JWT token with roles

### UserService
- `list_users(db, tenant, current_user)` → list[UserRead]
- `list_users_for_institute(db, tenant, institute_id, current_user)` → list[UserRead]
- `create_user(db, payload, tenant, current_user)` → UserRead
- `approve_user(db, user_id, approve, tenant)` → UserRead
  - Converts UserSelectedCourse → UserCourse
  - Creates UserModule entries
- `assign_user_institute(db, user_id, institute_id)` → UserRead
- `assign_user_roles(db, user_id, role_names, tenant)` → list[str]
- `delete_user(db, user_id, tenant)` → None
- `update_user(db, user_id, payload, tenant)` → UserRead
- `update_profile(db, current_user, payload)` → UserRead

### CourseService
- `create_course(db, payload, tenant, current_user)` → Course
- `create_subcourse(db, payload, tenant, current_user)` → SubCourse
- `create_module(db, payload, tenant, current_user)` → Module
- `list_courses(db, tenant, current_user)` → list[Course]
- `list_courses_for_institute(db, tenant, institute_id, current_user)` → list[Course]
- `list_subcourses(db, tenant, current_user, course_id)` → list[SubCourse]
- `list_subcourses_for_institute(db, tenant, institute_id, current_user, course_id)` → list[SubCourse]
- `list_modules(db, tenant, current_user, course_id, subcourse_id)` → list[Module]
- `list_modules_for_institute(db, tenant, institute_id, current_user, course_id, subcourse_id)` → list[Module]
- `list_public_courses(db, tenant)` → list[Course]
- `list_public_subcourses(db, tenant)` → list[SubCourse]
- `update_course(db, course_id, payload, tenant, current_user)` → Course
- `update_subcourse(db, subcourse_id, payload, tenant, current_user)` → SubCourse
- `delete_course(db, course_id, tenant, current_user)` → None
- `delete_subcourse(db, subcourse_id, tenant, current_user)` → None

### BatchService
- `create_batch(db, payload, tenant, current_user)` → Batch
- `update_batch(db, batch_id, payload, tenant, current_user)` → Batch
- `list_batches(db, tenant, current_user)` → list[Batch]
- `list_batches_for_institute(db, tenant, institute_id, current_user)` → list[Batch]
- `delete_batch(db, batch_id, tenant, current_user)` → None
- `get_batch_detail(db, batch_id, tenant, current_user, institute_id)` → dict
- `assign_user_to_batch(db, payload, tenant, current_user)` → UserBatch
- `assign_teacher_to_batch(db, payload, tenant, current_user)` → BatchTeacher

### EnrollmentService
- `assign_user_to_course(db, payload, tenant, current_user)` → UserCourse
  - Validates user, course, subcourse
  - Creates UserModule entries
  - Auto-creates modules if not exists

### ProgressService
- `mark_module_completion(db, current_user, payload, tenant)` → UserProgress
- `list_my_progress(db, current_user, tenant)` → list[UserProgress]

### ContentService
- `create_content(db, payload, tenant, current_user, file)` → ContentRead
- `update_content(db, content_id, payload, tenant, current_user, file)` → ContentRead
- `delete_content(db, content_id, tenant, current_user)` → None
- `list_module_contents(db, module_id, tenant, current_user)` → list[ContentRead]
- `list_public_contents(db, module_id, tenant)` → list[ContentRead]

### StudentService
- `get_enrolled_courses(db, current_user, tenant)` → list[dict]
- `get_my_modules_with_content(db, current_user, tenant)` → list[dict]
- `get_student_batches(db, current_user, tenant)` → list[dict]
- `get_student_course_workspace(db, current_user, tenant, course_id, category)` → dict
- `submit_student_content(db, current_user, tenant, content_id, response_type, response_text, response_url)` → dict

### InstituteService
- `create_institute(db, payload)` → Institute
- `list_institutes(db, current_user)` → list[Institute]
- `update_institute(db, institute_id, payload)` → Institute
- `delete_institute(db, institute_id)` → None

### BootstrapService
- `bootstrap_defaults(db)` → None
  - Creates default institute
  - Creates default roles
  - Creates default super admin

---

## 7. VALIDATION & BUSINESS RULES

### Email Validation
- Must be valid email format (EmailStr from Pydantic)
- Must be unique across users
- Must be unique across institutes

### Password Validation
- Minimum 8 characters
- Hashed with Argon2 before storage

### User State Transitions
```
Registration → is_approved=False, active=True
      ↓
Approval → is_approved=True, active=True (auto-enroll)
      ↓
Deactivation → active=False, is_approved=False
```

### Content Type Rules
```
text:
  - No file_url
  - No file upload
  - Requires description or external_url
  
quiz:
  - No file_url
  - No file upload
  - Requires description or external_url
  
video, audio, pdf, document:
  - Requires file_url or external_url
  - Can have optional file upload
```

### Order of Hierarchy
```
Institute (1:N)
├── Course (1:N)
│   ├── SubCourse (1:N)
│   │   ├── Module (1:N)
│   │   │   └── Content (1:N)
│   │   └── User Enrollment
│   └── Batch (1:N)
│       ├── BatchTeacher (N:M)
│       └── BatchStudent (N:M)
└── User
    ├── UserRole (N:M)
    ├── UserCourse (N:M SubCourse)
    ├── UserBatch (N:M)
    ├── UserModule (N:M)
    ├── UserProgress (1:N)
    └── StudentSubmission (1:N)
```

### Scope Rules for Teachers
- Can only teach batches assigned to them
- Can only manage content for courses in their taught batches
- Can only edit content they created
- Cannot create top-level courses/subcourses
- If also admin, can perform admin actions

### Scope Rules for Students
- Can only access courses they're enrolled in
- Can only see modules in enrolled subcourses
- Can only view content in accessible modules
- Can only access batches they're assigned to

---

## 8. ERROR HANDLING

### HTTP Status Codes

| Code | Scenario |
|------|----------|
| 200 | Success |
| 201 | Resource created |
| 204 | No content (preflight) |
| 400 | Bad request (validation) |
| 401 | Unauthorized (auth required) |
| 403 | Forbidden (insufficient perms) |
| 404 | Not found |
| 409 | Conflict (duplicate, integrity) |
| 500 | Server error (bootstrap failure) |

### Common Validation Errors
- Email already registered (409)
- Invalid course/subcourse (400)
- User not found (404)
- Batch not found (404)
- Module not found (404)
- Not enough privileges (403)
- User can only access own institute (403)

### Database Errors
- IntegrityError: Converted to 409 Conflict with details
- Rollback on transaction failure
- Cascade delete on model deletion

---

## 9. CONFIGURATION

### Environment Variables
```
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

CLOUDINARY_CLOUD_NAME=optional
CLOUDINARY_API_KEY=optional
CLOUDINARY_API_SECRET=optional

DEFAULT_SUPER_ADMIN_EMAIL=admin@gmail.com
DEFAULT_SUPER_ADMIN_PASSWORD=Admin123
DEFAULT_SUPER_ADMIN_FIRST_NAME=Super
DEFAULT_SUPER_ADMIN_LAST_NAME=Admin
DEFAULT_SUPER_ADMIN_MOB_NO=9999999999

CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
```

### CORS Configuration
- Allow credentials: True
- Allow methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Allow headers: * (all)
- Expose headers: * (all)

---

## 10. RELATIONSHIPS DIAGRAM

```
┌─────────────┐
│  Institute  │
└──────┬──────┘
       │
       ├─→ User (1:N)
       │   ├─→ Auth (1:1)
       │   └─→ UserRole (N:M Role)
       │
       ├─→ Course (1:N)
       │   └─→ SubCourse (1:N)
       │       ├─→ Module (1:N)
       │       │   └─→ Content (1:N)
       │       │       ├─→ ContentProfile (1:1)
       │       │       └─→ StudentSubmission (1:N)
       │       └─→ UserCourse (N:M User)
       │
       └─→ Batch (1:N)
           ├─→ BatchDetail (1:1)
           ├─→ BatchTeacher (N:M User)
           └─→ UserBatch (N:M User)

UserProgress
├─→ User (N:1)
├─→ Module (N:1)
└─→ Institute (N:1)
```

---

## Summary

This is a comprehensive LMS backend with:
- **8 API modules**: Auth, Users, Institutes, Courses, Content, Batches, Enrollment, Progress, Students
- **17+ database models** with proper relationships
- **Multi-tenant support** with configurable mode
- **Role-based access control** with 4 default roles
- **Scope-based authorization** for teachers and students
- **Complete CRUD operations** for all entities
- **User lifecycle management** with approval workflow
- **Content management** with file upload support
- **Progress tracking** for modules and courses
- **Batch management** for organizing students and teachers

