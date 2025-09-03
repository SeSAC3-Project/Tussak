import React from 'react';

const CompanyOverview = () => {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">기업개요</h2>
            <p className="text-gray-600 leading-relaxed text-sm mb-6">
                대한전선 베트남 생산법인 대한비나, 초고압 케이블 공장 짓는다. 
                대한전선 베트남 생산법인 대한비나, 초고압 케이블 공장 짓는다. 
                대한전선 베트남 생산법인 대한비나, 초고압 케이블 공장 짓는다. 
                대한전선 베트남 생산법인 대한비나, 초고압 케이블 공장 짓는다. 
                대한전선 베트남 생산법인 대한비나, 초고압 케이블 공장 짓는다.
            </p>
            <div className="flex justify-end">
                <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center hover:bg-green-500 transition-colors cursor-pointer shadow-md">
                    챗봇이
                </div>
            </div>
        </div>
    );
};

export default CompanyOverview;