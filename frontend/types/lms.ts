export interface Institute {
  institute_id: string;
  name: string;
  email: string;
  mob_no: string;
  country: string;
  state: string;
  place: string;
  pincode: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  user_id: string;
  institute_id: string;
  institute_name?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  mob_no: string;
  is_approved: boolean;
  active: boolean;
  role_names: string[];
  created_at: string;
}

export interface Course {
  course_id: string;
  institute_id: string;
  course_name: string;
  active: boolean;
}

export interface SubCourse {
  subcourse_id: string;
  course_id: string;
  institute_id: string;
  subcourse_name: string;
  active: boolean;
}

export interface Module {
  module_id: string;
  course_id: string;
  subcourse_id: string;
  institute_id: string;
  module_name: string;
  active: boolean;
}

export interface Content {
  content_id: string;
  institute_id: string;
  module_id: string;
  title: string;
  type: string;
  url: string;
  duration: number;
}

export interface Batch {
  batch_id: string;
  institute_id: string;
  course_id: string;
  subcourse_id: string;
  batch_name: string;
  active: boolean;
}

export interface UserProgress {
  id: string;
  institute_id: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  progress_percent: number;
  last_accessed: string;
}

export interface MessageResponse {
  message: string;
}
