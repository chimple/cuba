import React, { useState, useEffect } from "react";
import "./CreateSchool.css";
import { useHistory } from "react-router-dom";
import { t } from "i18next";
import Header from "../components/homePage/Header";
import { ServiceConfig } from "../../services/ServiceConfig";
import { RequestTypes } from "../../common/constants";
import SelectField from "../components/SelectField";

const CreateSchool: React.FC = () => {
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [udise, setUdise] = useState("");
  const [sending, setSending] = useState(false);

  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);

  const [isCountriesLoading, setCountriesLoading] = useState(false);
  const [isStatesLoading, setStatesLoading] = useState(false);
  const [isDistrictsLoading, setDistrictsLoading] = useState(false);
  const [isBlocksLoading, setBlocksLoading] = useState(false);

  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;

  // Load countries
  useEffect(() => {
    const loadCountries = async () => {
      setCountriesLoading(true);
      const data = await api.getGeoData({});
      setCountries(data);
      setCountriesLoading(false);
    };
    loadCountries();
  }, [api]);

  // Load states when country changes
  useEffect(() => {
    setState("");
    setStates([]);
    if (country) {
      const loadStates = async () => {
        setStatesLoading(true);
        const data = await api.getGeoData({ p_country: country });
        setStates(data);
        setStatesLoading(false);
      };
      loadStates();
    }
  }, [country, api]);

  // Load districts when state changes
  useEffect(() => {
    setDistrict("");
    setDistricts([]);
    if (country && state) {
      const loadDistricts = async () => {
        setDistrictsLoading(true);
        const data = await api.getGeoData({
          p_country: country,
          p_state: state,
        });
        setDistricts(data);
        setDistrictsLoading(false);
      };
      loadDistricts();
    }
  }, [state, country, api]);

  // Load blocks when district changes
  useEffect(() => {
    setBlock("");
    setBlocks([]);
    if (state && district) {
      const loadBlocks = async () => {
        setBlocksLoading(true);
        const data = await api.getGeoData({
          p_country: country,
          p_state: state,
          p_district: district,
        });
        setBlocks(data);
        setBlocksLoading(false);
      };
      loadBlocks();
    }
  }, [district, state, country, api]);

  const handleSendRequest = async () => {
    setSending(true);
    const school = await api.createSchool(
      schoolName,
      state,
      district,
      block,
      null,
      null,
      null,
      udise,
      null,
      country
    );
    await api.sendJoinSchoolRequest(school.id, RequestTypes.SCHOOL);
    setSending(false);
  };

  return (
    <div className="create-school-page">
      <div className="create-school-header">
        <Header isBackButton onBackButtonClick={() => history.goBack()} />
      </div>

      <div className="create-school-container">
        <div className="create-school-box">
          <h2 className="create-school-title">{t("Create School")}</h2>

          <div className="create-school-icon">
            <img src="/assets/icons/School_image.svg" alt="School" />
          </div>

          <div className="create-school-card">
            <SelectField
              label={t("Country")}
              value={country}
              options={countries}
              placeholder={t("Select Country") || ""}
              disabled={isCountriesLoading}
              onChange={setCountry}
            />
            <SelectField
              label={t("State")}
              value={state}
              options={states}
              placeholder={t("Select State") || ""}
              disabled={!country || isStatesLoading}
              onChange={setState}
            />
            <SelectField
              label={t("District")}
              value={district}
              options={districts}
              placeholder={t("Select District") || ""}
              disabled={!state || isDistrictsLoading}
              onChange={setDistrict}
            />
            <SelectField
              label={t("Block")}
              value={block}
              options={blocks}
              placeholder={t("Select Block") || ""}
              disabled={!district || isBlocksLoading}
              onChange={setBlock}
            />

            {/* School Name */}
            <div className="create-school-row">
              <span className="create-school-label">{t("School Name")}</span>
              <input
                className="create-school-input"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </div>

            {/* UDISE */}
            <div className="create-school-row no-border">
              <span className="create-school-label">UDISE</span>
              <input
                className="create-school-input"
                value={udise}
                onChange={(e) => setUdise(e.target.value)}
              />
            </div>
          </div>

          <button
            className="create-school-btn"
            disabled={
              sending ||
              !country ||
              !state ||
              !district ||
              !block ||
              !schoolName ||
              !udise
            }
            onClick={handleSendRequest}
          >
            {sending ? t("Sending...") : t("Send Request")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSchool;
