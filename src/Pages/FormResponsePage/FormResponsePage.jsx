import React, { useEffect, useState } from "react";
import { fetchFormByUniqueUrl, saveFormResponse } from "../../api/Form";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import avatar from "../../assets/ThemeImages/avatar.png";
import { IoMdSend } from "react-icons/io";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "../FormResponsePage/FormResponsePage.module.css";

function FormResponsePage() {
  const { uniqueUrl } = useParams();
  const [responses, setResponses] = useState([]);
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [userDetails, setUserDetails] = useState({ email: "", name: "" });
  const [step, setStep] = useState("name");
  const [clickedButtons, setClickedButtons] = useState({});

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetchFormByUniqueUrl(uniqueUrl);
        if (response && response.form) {
          setForm(response.form);
          setResponses(response.form.fields || []);
          toast.success("Welcome! One email per user allowed. Repeated entries update previous submissions.");
        } else {
          toast.error("Form data is not available");
        }
      } catch (error) {
        toast.error("Error fetching form");
      }
    };

    fetchForm();
  }, [uniqueUrl]);

  useEffect(() => {
    if (step === "form" && currentFieldIndex < responses.length) {
      const field = responses[currentFieldIndex];
      if (!field.heading.startsWith("Input Rating") && !field.heading.startsWith("Input")) {
        const timer = setTimeout(() => {
          setCurrentFieldIndex((prevIndex) => prevIndex + 1);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [currentFieldIndex, responses, step]);

  const handleChange = (fieldId, value) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleUserDetailsChange = (e) => {
    const { name, value } = e.target;
    setUserDetails({ ...userDetails, [name]: value });
  };

  const handleUserDetailsSubmit = () => {
    if (step === "name" && userDetails.name) {
      setStep("email");
    } else if (step === "email" && userDetails.email) {
      setStep("form");
    } else {
      toast.error("Please fill in the required details");
    }
  };

  const handleSend = async (buttonValue, fieldId) => {
    const currentField = responses[currentFieldIndex];
    const valueToSend = buttonValue || formData[currentField._id];

    if (!valueToSend) {
      toast.error("This field is required, please fill it");
      return;
    }

    if (currentField.heading.startsWith("Input Email")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(valueToSend)) {
        toast.error("Only valid emails are allowed");
        return;
      }
    }

    if (currentField.heading.startsWith("Input Phone")) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(valueToSend)) {
        toast.error("Please enter a valid phone number with 10 digits");
        return;
      }
    }

    try {
      const responseDetails = {
        ...formData,
        email: userDetails.email,
        name: userDetails.name,
        [currentField._id]: valueToSend
      };
      await saveFormResponse(uniqueUrl, responseDetails);
      toast.success("Response submitted successfully");

      setClickedButtons({ ...clickedButtons, [fieldId]: true });
      setCurrentFieldIndex((prevIndex) => prevIndex + 1);
    } catch (error) {
      toast.error("Error submitting response");
    }
  };

  const renderMedia = (url) => {
    const trimmedUrl = url.trim();
    if (trimmedUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
      return (
        <img
          src={trimmedUrl}
          alt="Media content"
          style={{ maxWidth: "100%" }}
        />
      );
    } else if (trimmedUrl.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <video width="320" height="240" controls>
          <source src={trimmedUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    } else if (trimmedUrl.match(/\.(gif)$/i)) {
      return (
        <img
          src={trimmedUrl}
          alt="Media content"
          style={{ maxWidth: "100%" }}
        />
      );
    } else {
      return <p>Unsupported media type</p>;
    }
  };

  const getBackgroundColor = () => {
    if (form) {
      switch (form.theme) {
        case "blue":
          return "#508C9B";
        case "dark":
          return "#171923";
        default:
          return "#ffffff";
      }
    }
    return "#ffffff";
  };

  const getTextColor = () => {
    if (form) {
      switch (form.theme) {
        case "blue":
          return "black";
        case "dark":
          return "#ffffff";
        default:
          return "#000000";
      }
    }
    return "#000000";
  };

  return (
    <div className={styles.chatContainer} style={{ backgroundColor: getBackgroundColor() }}>
      {form ? (
        <div className={styles.centerWrapper}>
          <div className={styles.formContent}>
            <div className={styles.inputContainer}>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={userDetails.name}
                onChange={handleUserDetailsChange}
                className={styles.inputBox1}
                disabled={step !== "name"}
              />
              {step === "name" && (
                <button
                  onClick={handleUserDetailsSubmit}
                  className={styles.sendButton}
                >
                  <IoMdSend size={"20px"} color="#FFFFFF" />
                </button>
              )}
            </div>
            {step !== "name" && (
              <div className={styles.inputContainer}>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={userDetails.email}
                  onChange={handleUserDetailsChange}
                  className={styles.inputBox2}
                  disabled={step !== "email"}
                />
                {step === "email" && (
                  <button
                    onClick={handleUserDetailsSubmit}
                    className={styles.sendButton}
                  >
                    <IoMdSend size={"20px"} color="#FFFFFF" />
                  </button>
                )}
              </div>
            )}
            {step === "form" && (
              <div>
                {responses
                  .slice(0, currentFieldIndex + 1)
                  .map((field, index) => (
                    <div key={field._id} className={styles.fieldContainer}>
                      {field.heading.startsWith("Input Email") ? (
                        <div>
                          <h3 style={{ color: getTextColor() }}>{field.value}</h3>
                          <input
                            type="email"
                            value={formData[field._id] || ""}
                            onChange={(e) => handleChange(field._id, e.target.value)}
                            placeholder="Enter your email"
                            className={`${styles.inputBox} ${clickedButtons[field._id] ? styles.disabledInput : ''}`}
                            disabled={clickedButtons[field._id]}
                          />
                          <button
                            onClick={() => handleSend(null, field._id)}
                            className={`${styles.sendButton} ${clickedButtons[field._id] ? styles.disabledButton : ''}`}
                            disabled={clickedButtons[field._id]}
                          >
                            <IoMdSend size={"20px"} color="#FFFFFF" />
                          </button>
                        </div>
                      ) : field.heading.startsWith("Input Rating") ? (
                        <div className={styles.ratingsend}>
                          <h3>{field.value}</h3>
                          <div className={`${styles.ratingContainer} ${clickedButtons[field._id] ? styles.disabledRating : ''}`}>
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <span
                                key={rating}
                                className={`${styles.ratingBox} ${formData[field._id] === rating ? styles.selectedRating : ''} ${clickedButtons[field._id] ? styles.disabledRating : ''}`}
                                onClick={() => !clickedButtons[field._id] && handleChange(field._id, rating)}
                              >
                                {rating}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => handleSend(null, field._id)}
                            className={`${styles.sendButton} ${clickedButtons[field._id] ? styles.disabledButton : ''}`}
                            disabled={clickedButtons[field._id]}
                          >
                            <IoMdSend size={"20px"} color="#FFFFFF" />
                          </button>
                        </div>
                      ) : field.heading.startsWith("Input Date") ? (
                        <div className={styles.fieldContainer}>
                          <h3>{field.value}</h3>
                         <div className={styles.datepicker1}>
                         <DatePicker
                            selected={formData[field._id] || null}
                            onChange={(date) => handleChange(field._id, date)}
                            dateFormat="dd-MM-yyyy"
                            className={`${styles.inputBox} ${clickedButtons[field._id] ? styles.disabledInput : ''}`}
                            placeholderText="Select a date"
                            disabled={clickedButtons[field._id]}
                          />
                          <button
                            onClick={() => handleSend(null, field._id)}
                            className={`${styles.sendButton} ${clickedButtons[field._id] ? styles.disabledButton : ''}`}
                            disabled={clickedButtons[field._id]}
                          >
                            <IoMdSend size={"20px"} color="#FFFFFF" />
                          </button>
                         </div>
                        </div>
                      ) : field.heading.startsWith("Input Number") ? (
                        <div>
                          <h3>{field.value}</h3>
                          <input
                            type="text"
                            value={formData[field._id] || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*$/.test(value)) {
                                handleChange(field._id, value);
                              } else {
                                toast.error("Only numbers are allowed");
                              }
                            }}
                            placeholder="Enter a number"
                            className={`${styles.inputBox} ${clickedButtons[field._id] ? styles.disabledInput : ''}`}
                            disabled={clickedButtons[field._id]}
                          />
                          <button
                            onClick={() => handleSend(null, field._id)}
                            className={`${styles.sendButton} ${clickedButtons[field._id] ? styles.disabledButton : ''}`}
                            disabled={clickedButtons[field._id]}
                          >
                            <IoMdSend size={"20px"} color="#FFFFFF" />
                          </button>
                        </div>
                      ) : field.heading.startsWith("Input Phone") ? (
                        <div>
                          <h3>{field.value}</h3>
                          <input
                            type="text"
                            value={formData[field._id] || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d{0,10}$/.test(value)) {
                                handleChange(field._id, value);
                              } else {
                                toast.error("Please enter a valid phone number with 10 digits");
                              }
                            }}
                            placeholder="Enter your phone"
                            className={`${styles.inputBox} ${clickedButtons[field._id] ? styles.disabledInput : ''}`}
                            disabled={clickedButtons[field._id]}
                          />
                          <button
                            onClick={() => handleSend(null, field._id)}
                            className={`${styles.sendButton} ${clickedButtons[field._id] ? styles.disabledButton : ''}`}
                            disabled={clickedButtons[field._id]}
                          >
                            <IoMdSend size={"20px"} color="#FFFFFF" />
                          </button>
                        </div>
                      ) : field.heading.startsWith("Input Buttons") ? (
                        <div className={styles.buttonFieldContainer}>
                          <button
                            onClick={() => handleSend(field.value, field._id)}
                            className={`${styles.actionButton} ${clickedButtons[field._id] ? styles.clicked : ''}`}
                            disabled={clickedButtons[field._id]}
                          >
                            {field.value}
                          </button>
                        </div>
                      ) : field.heading.startsWith("Input") ? (
                        <div>
                          <h3>{field.value}</h3>
                          <input
                            type="text"
                            value={formData[field._id] || ""}
                            onChange={(e) =>
                              handleChange(field._id, e.target.value)
                            }
                            placeholder="Enter your text"
                            className={`${styles.inputBox} ${clickedButtons[field._id] ? styles.disabledInput : ''}`}
                            disabled={clickedButtons[field._id]}
                          />
                          <button
                            onClick={() => handleSend(null, field._id)}
                            className={`${styles.sendButton} ${clickedButtons[field._id] ? styles.disabledButton : ''}`}
                            disabled={clickedButtons[field._id]}
                          >
                            <IoMdSend size={"20px"} color="#FFFFFF" />
                          </button>
                        </div>
                      ) : (
                        <div className={styles.mediaContainer}>
                          <img src={avatar} alt="" />
                          <div>
                            {field.value.match(
                              /\.(jpeg|jpg|gif|png|mp4|webm|ogg|gif)$/i
                            ) ? (
                              renderMedia(field.value)
                            ) : (
                              <h3 className={styles.bubbleheading} style={{ color: getTextColor()}}>{field.value}</h3>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>Loading form...</p>
      )}
    </div>
  );
}

export default FormResponsePage;
