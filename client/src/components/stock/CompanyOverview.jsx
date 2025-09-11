const CompanyOverview = ({ companyInfo }) => {

    return (
        <div className="bg-white rounded-[20px] h-[425px] w-full lg:w-1/2 py-[19px] px-[28px]" style={{fontFamily: 'DM Sans'}}>
            <h2 className="text-[20px] font-bold text-[#0F250B] mb-3">기업개요</h2>
            <div className="h-[340px] overflow-y-auto">
                <p className="text-[#8A8A8A] leading-relaxed text-sm lg:text-base">
                    {companyInfo || "기업 개요 정보를 불러오는 중입니다..."}
                </p>
            </div>
        </div>
    );
};

export default CompanyOverview;