import React, { useState, useEffect, useRef } from "react";
import "./CreateSchool.css";
import { useHistory, useLocation } from "react-router-dom";
import { t } from "i18next";
import Header from "../components/homePage/Header";
import { ServiceConfig } from "../../services/ServiceConfig";
import { PAGES, RequestTypes } from "../../common/constants";
import SelectField from "../components/SelectField";

interface CreateSchoolLocationState {
  country?: string;
  state?: string;
  district?: string;
  block?: string;
}

const CreateSchool: React.FC = () => {
  const history = useHistory();
  const location = useLocation<CreateSchoolLocationState>();
  const api = ServiceConfig.getI().apiHandler;

  const prefilledData = location.state || {};
  const isInitialLoad = useRef(true);

  const [country, setCountry] = useState(prefilledData.country || "");
  const [state, setState] = useState(prefilledData.state || "");
  const [district, setDistrict] = useState(prefilledData.district || "");
  const [block, setBlock] = useState(prefilledData.block || "");
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
    // On user interaction (not initial load), clear dependent fields
    if (!isInitialLoad.current) {
      setState("");
      setDistrict("");
      setBlock("");
      setStates([]);
      setDistricts([]);
      setBlocks([]);
    }
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
    // On user interaction (not initial load), clear dependent fields
    if (!isInitialLoad.current) {
      setDistrict("");
      setBlock("");
      setDistricts([]);
      setBlocks([]);
    }
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
    // On user interaction (not initial load), clear dependent fields
    if (!isInitialLoad.current) {
      setBlock("");
      setBlocks([]);
    }
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

  // This effect runs only once after the initial render
  useEffect(() => {
    // After all initial effects have run, set the ref to false.
    // Any subsequent changes will be from user interaction.
    isInitialLoad.current = false;
  }, []); // <-- 2. Empty dependency array ensures this runs only once

  const handleSendRequest = async () => {
    try {
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
        country,
        true,
        false,
      );
      await api.sendJoinSchoolRequest(school.id, RequestTypes.SCHOOL);
      history.replace(PAGES.POST_SUCCESS);
    } catch (error) {
      console.error("Error creating school:", error);
    } finally {
      setSending(false);
    }
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
