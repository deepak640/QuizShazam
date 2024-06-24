import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import "../css/Upload.css";
import { useMutation } from "react-query";
import { uploadData } from "../func/apiCalls";

const UploadQuiz = () => {
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);
  const [uploaded, setUploaded] = useState(false);

  const { mutate, isLoading } = useMutation(async (values) => {
    // return await uploadData(values);
    return values;
  });
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (
      file &&
      (file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel")
    ) {
      setFile(file);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "array" });
      const sheet = workbook.Sheets["Multi option"];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log("🚀 ~ handleUpload ~ jsonData:", jsonData)

      // Create an object to store subjects with their questions
      const subjects = {};

      // Skip the header row and process each row
      jsonData.slice(1).forEach((row) => {
        const subject = row[0];
        const questionText = row[1];
        const options = row.slice(2, 6);
        const correctOptionIndex = row[6] - 1; // Convert to 0-based index

        // Map options to an array of objects with text and isCorrect fields
        const mappedOptions = options.map((option, i) => ({
          text: option,
          isCorrect: i === correctOptionIndex,
        }));

        // Check if the subject already exists in the object
        if (!subjects[subject]) {
          subjects[subject] = [];
        }

        // Add the question to the subject's array
        subjects[subject].push({
          questionText,
          options: mappedOptions,
        });
      });

      // Create an array to store the final JSON objects for each subject
      const finalJsonArray = Object.keys(subjects).map((subject) => ({
        title: `${subject} Quiz`,
        description: `Test your knowledge on ${subject} with this fun quiz!`,
        questions: subjects[subject],
        authorId: "lkasjkdhajkshd",
      }));
      console.log("🚀 ~ finalJsonArray ~ finalJsonArray:", finalJsonArray)


      setJsonData(finalJsonArray);
      setUploaded(true);
    };


    reader.readAsArrayBuffer(file);
  };

  const handlePost = async () => {
    if (!jsonData) {
      setError("Please upload a file first");
      return;
    }
    // mutate(jsonData, {
    //   onSuccess: (data) => {
    //     console.log(data);
    //   },
    // });
  };

  return (
    <div className="upload-container">
      <h1>Upload Quiz</h1>
      <p>
        Upload an Excel sheet to create a new quiz. The sheet should have the
        following format: question, answer, options (comma-separated).
      </p>
      <div className="form-group">
        <label htmlFor="excelFile">Excel File</label>
        <input type="file" id="excelFile" onChange={handleFileChange} />
      </div>
      <button className="btn" onClick={handleUpload} disabled={!file}>
        Upload
      </button>
      {uploaded && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> Quiz uploaded successfully!
          <p>
            Your quiz has been uploaded and is now available for students to
            take.
          </p>
          <button onClick={handlePost}>Post to API</button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle"></i> There was an error
          uploading your quiz.
          <p>Please check the format of your Excel sheet and try again.</p>
        </div>
      )}
    </div>
  );
};

export default UploadQuiz;
