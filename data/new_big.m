a = imread('big_column_flatten.png');
new_big_5 = [a(1:9,:);a(20:37,:);a(48:65,:);a(76:93,:);a(104:121,:);a(132:149,:);a(160:177,:);a(188:205,:);a(216:233,:);a(244:261,:);a(272:281,:);];
% new_big_5 = [a(1,:);a(20,:);a(48,:);a(76,:);...
%     a(104,:);a(132,:);a(160,:);a(188,:);a(216,:);...
%     a(244,:);a(272,:);];
new_big_5_row = zeros(size(new_big_5));
for i=1:size(new_big_5,1)
    temp = reshape(new_big_5(i,:), 28,28);
    new_big_5_row(i,:) = reshape(temp',1,28*28);
end
% image(temp);
imwrite(new_big_5_row,'new_big_5_row.png')

% b = imread('big_column_flatten.png');
% new_big_4 = [b(1:10,:);b(19:38,:);b(47:66,:);b(75:94,:);b(103:122,:);b(131:150,:);b(159:178,:);b(187:206,:);b(215:234,:);b(243:262,:);b(271:281,:);];
% imwrite(new_big_4,'new_big_4.png')